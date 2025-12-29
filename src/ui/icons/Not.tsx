// src/ui/icons/Not.tsx

import React from 'react';

export const NotIcon = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <div style={{ color: 'red' }}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </svg>
    </div>
  );
};
