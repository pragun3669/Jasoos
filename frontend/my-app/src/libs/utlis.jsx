// Simple class names combiner function
export function cn(...classes) {
    return classes.filter(Boolean).join(' ');
  }
  