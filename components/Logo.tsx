import React from 'react';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "h-8 w-8" }) => {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      aria-label="VisuLab Logo"
    >
      {/* Outer Circle representing the Lens Block */}
      <circle 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="2" 
        className="opacity-100"
      />
      
      {/* Inner Lens Curves representing Stock/Inventory */}
      <path 
        d="M7 9C7 9 12 11.5 17 9" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M7 12.5C7 12.5 12 15 17 12.5" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M7 16C7 16 12 18.5 17 16" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      {/* Reflection Detail */}
      <path 
        d="M15.5 5.5C16.5 6 17.5 7 18 8" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round"
        className="opacity-60"
      />
    </svg>
  );
};