import React from 'react';

export function Badge({ children, className = '', ...props }) {
  return (
    <span
      {...props}
      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100 ${className}`}
    >
      {children}
    </span>
  );
}
