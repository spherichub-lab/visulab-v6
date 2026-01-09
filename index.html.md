<!DOCTYPE html>
<html lang="pt-BR" class="light">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#2563eb" />
    <title>VisuLab</title>
    
    <!-- PWA Manifest -->
    <link rel="manifest" href="/manifest.json" />
    
    <!-- Dynamic SVG Favicon (Based on existing Logo) -->
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%232563eb' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10' stroke-opacity='1'/%3E%3Cpath d='M7 9C7 9 12 11.5 17 9'/%3E%3Cpath d='M7 12.5C7 12.5 12 15 17 12.5'/%3E%3Cpath d='M7 16C7 16 12 18.5 17 16'/%3E%3Cpath d='M15.5 5.5C16.5 6 17.5 7 18 8' stroke-opacity='0.6'/%3E%3C/svg%3E" />

    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
      rel="stylesheet"
    />
    <!-- Material Symbols -->
    <link
      href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
      rel="stylesheet"
    />
    <script>
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            colors: {
              primary: "var(--brand-accent)",
              "primary-dark": "var(--brand-accent-dark)",
              "accent-purple": "#8b5cf6",
              "accent-orange": "#f97316",
              "accent-green": "#10b981",
              "background-light": "#f8fafc", 
              "background-dark": "#0f172a", // Slate 900
              "surface-dark": "#1e293b",    // Slate 800
            },
            fontFamily: {
              display: ["Inter", "sans-serif"],
            },
            boxShadow: {
              soft: "0 4px 20px -2px rgba(0, 0, 0, 0.05)",
              card: "0 2px 10px rgba(0,0,0,0.02)",
              hover: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            },
          },
        },
      };
    </script>
    <style>
        :root {
            /* Brand Colors - Blue Theme */
            --brand-accent: #2563eb;       /* Blue 600 */
            --brand-accent-dark: #1e40af;  /* Blue 800 */
        }

        html.dark {
            --brand-accent: #3b82f6;       /* Blue 500 for dark mode */
            --brand-accent-dark: #60a5fa; 
        }

        body { font-family: 'Inter', sans-serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        /* Custom Calendar Picker Icon Color */
        input[type="date"]::-webkit-calendar-picker-indicator {
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2364748b'%3E%3Cpath d='M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5z'/%3E%3C/svg%3E");
            background-position: center;
            background-repeat: no-repeat;
            background-size: 20px;
            cursor: pointer;
        }
        
        /* Dark Mode Calendar Icon override */
        html.dark input[type="date"]::-webkit-calendar-picker-indicator {
             filter: invert(1);
        }

        /* Dropdown Selection Color Override */
        select option:checked,
        select:focus > option:checked {
            background: var(--brand-accent) !important;
            color: #ffffff !important;
        }
    </style>
  <script type="importmap">
{
  "imports": {
    "react-dom/client": "https://aistudiocdn.com/react-dom@^19.2.1/client",
    "react-dom": "https://aistudiocdn.com/react-dom@^19.2.1",
    "react/": "https://aistudiocdn.com/react@^19.2.1/",
    "react": "https://aistudiocdn.com/react@^19.2.1",
    "recharts": "https://aistudiocdn.com/recharts@^3.5.1",
    "react-router": "https://aistudiocdn.com/react-router@^6.22.3",
    "react-router-dom": "https://aistudiocdn.com/react-router-dom@^6.22.3",
    "@remix-run/router": "https://aistudiocdn.com/@remix-run/router@^1.15.3",
    "date-fns/": "https://aistudiocdn.com/date-fns@^2.30.0/",
    "date-fns": "https://aistudiocdn.com/date-fns@^2.30.0",
    "html2canvas": "https://aistudiocdn.com/html2canvas@^1.4.1",
    "jspdf": "https://aistudiocdn.com/jspdf@^3.0.4",
    "file-saver": "https://aistudiocdn.com/file-saver@^2.0.5",
    "react-dom/": "https://aistudiocdn.com/react-dom@^19.2.1/",
    "@supabase/supabase-js": "https://esm.sh/@supabase/supabase-js@^2.87.1"
  }
}
</script>
</head>
  <body class="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 antialiased transition-colors duration-300">
    <div id="root"></div>
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js')
            .then(registration => {
              console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
              console.log('SW registration failed: ', registrationError);
            });
        });
      }
    </script>
  </body>
</html>