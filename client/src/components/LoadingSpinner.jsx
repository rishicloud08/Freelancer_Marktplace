import React from 'react';

const LoadingSpinner = ({ fullPage = false }) => {
  const spinner = (
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
  );

  if (fullPage) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        {spinner}
      </div>
    );
  }

  return <div className="flex justify-center p-4">{spinner}</div>;
};
export default LoadingSpinner;