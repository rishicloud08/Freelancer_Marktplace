import React from 'react';

const AIMatchBadge = ({ score }) => {
  let colorClass = 'bg-gray-100 text-gray-800 border-gray-200';
  if (score >= 80) colorClass = 'bg-green-50 text-green-700 border-green-200';
  else if (score >= 50) colorClass = 'bg-yellow-50 text-yellow-700 border-yellow-200';
  else if (score >= 0) colorClass = 'bg-red-50 text-red-700 border-red-200';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
      AI Match: {score}%
    </span>
  );
};
export default AIMatchBadge;