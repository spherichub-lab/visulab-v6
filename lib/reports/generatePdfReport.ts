import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';

export interface PdfElements {
  kpiCards: HTMLElement[];     // Should contain [CardA, CardB, CardC, CardD]
  indexChart: HTMLElement;     // Row 3
  treatmentChart: HTMLElement; // Row 4
  companyChart: HTMLElement;   // Row 5
}

export const generatePdfReport = async (
  elements: PdfElements
) => {
  const { kpiCards, indexChart, treatmentChart, companyChart } = elements;

  // Validation
  if (kpiCards.length < 4 || !indexChart || !treatmentChart || !companyChart) {
    console.error('Missing elements for 5-row PDF layout generation');
    return;
  }

  const doc = new jsPDF('p', 'mm', 'a4'); // Portrait, A4
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - (margin * 2);
  let cursorY = 12; // Reduced top margin

  // --- Title & Metadata ---
  doc.setFontSize(14);
  doc.setTextColor(233, 106, 41); // #E96A29 (Primary Orange)
  doc.text('Relatório de Análise - VisuLab', margin, cursorY);
  
  cursorY += 5;
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, margin, cursorY);
  cursorY += 6;
  
  // Helper to capture and add image with reduced scaling
  const captureAndAdd = async (element: HTMLElement, x: number, y: number, w: number) => {
      // Use scale 1.0 to keep sizes compact on the canvas capture
      const canvas = await html2canvas(element, { 
          scale: 1.2, // Slightly higher than 1 for crispness but lower than 1.5/2 to save size
          backgroundColor: '#ffffff',
          logging: false
      }); 
      const imgData = canvas.toDataURL('image/png');
      const imgProps = doc.getImageProperties(imgData);
      
      // Calculate height maintaining aspect ratio
      const pdfHeight = (imgProps.height * w) / imgProps.width;
      
      doc.addImage(imgData, 'PNG', x, y, w, pdfHeight);
      return pdfHeight;
  };

  try {
      // --- Row 1: KPI A & B ---
      const gap = 3; // Reduced gap
      const cardWidth = (contentWidth - gap) / 2;
      
      const h1 = await captureAndAdd(kpiCards[0], margin, cursorY, cardWidth);
      const h2 = await captureAndAdd(kpiCards[1], margin + cardWidth + gap, cursorY, cardWidth);
      cursorY += Math.max(h1, h2) + gap;

      // --- Row 2: KPI C & D ---
      const h3 = await captureAndAdd(kpiCards[2], margin, cursorY, cardWidth);
      const h4 = await captureAndAdd(kpiCards[3], margin + cardWidth + gap, cursorY, cardWidth);
      cursorY += Math.max(h3, h4) + gap; 

      // --- Row 3: Index Chart (Full Width) ---
      const hIndex = await captureAndAdd(indexChart, margin, cursorY, contentWidth);
      cursorY += hIndex + gap;

      // --- Row 4: Treatment Chart (Full Width) ---
      const hTreat = await captureAndAdd(treatmentChart, margin, cursorY, contentWidth);
      cursorY += hTreat + gap;

      // --- Row 5: Company Chart (Full Width) ---
      // Check fit, if not, allow overflow or scale down
      const spaceRemaining = pageHeight - cursorY - margin;
      
      // Capture first to check dimensions
      const companyCanvas = await html2canvas(companyChart, { scale: 1.2, backgroundColor: '#ffffff' });
      const cImgData = companyCanvas.toDataURL('image/png');
      const cProps = doc.getImageProperties(cImgData);
      let cHeight = (cProps.height * contentWidth) / cProps.width;

      if (cHeight > spaceRemaining) {
          // If it doesn't fit, we force it to fit by scaling height (squashing slightly) 
          // or just letting it be small. For better UI, we usually just fit it.
          // Since "All cards must fit on single page", we scale it to fit remaining space if strictly needed,
          // but typically reducing scale above handles it. 
          if (spaceRemaining > 30) {
            doc.addImage(cImgData, 'PNG', margin, cursorY, contentWidth, spaceRemaining); 
          } else {
             // If space is absurdly small, add page (fallback)
             doc.addPage();
             doc.addImage(cImgData, 'PNG', margin, 10, contentWidth, cHeight);
          }
      } else {
          doc.addImage(cImgData, 'PNG', margin, cursorY, contentWidth, cHeight);
      }

      // Save
      doc.save(`relatorio_${format(new Date(), 'yyyyMMdd')}.pdf`);

  } catch (error) {
    console.error('Error generating PDF', error);
    alert('Erro ao gerar o relatório PDF.');
  }
};