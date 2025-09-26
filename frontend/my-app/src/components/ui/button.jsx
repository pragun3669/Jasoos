import React from 'react';

export function Button({ children, className = '', size, ...props }) {
  let sizeClass = '';

  if (size === 'sm') sizeClass = 'px-3 py-1 text-sm';
  else if (size === 'lg') sizeClass = 'px-6 py-3 text-lg';
  else sizeClass = 'px-4 py-2';

  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 
        bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500
        ${sizeClass} ${className}`}
    >
      {children}
    </button>
  );
}
