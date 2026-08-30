import React, { useState } from 'react';
import { FaStar } from 'react-icons/fa';

const StarRating = ({ 
  value,
  rating,
  onChange, 
  readOnly = false, 
  size = 'md',
  showLabel = false 
}) => {
  const [hoverValue, setHoverValue] = useState(0);

  const starSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  const experienceLabels = {
    1: '1 Star - Beginner (0-1 yrs)',
    2: '2 Stars - Intermediate (1-2 yrs)',
    3: '3 Stars - Proficient (2-4 yrs)',
    4: '4 Stars - Advanced (4-6 yrs)',
    5: '5 Stars - Expert (6+ yrs)'
  };

  const currentScore = value !== undefined ? value : (rating !== undefined ? rating : 5);
  const activeValue = hoverValue || currentScore || 0;

  return (
    <div className="flex flex-col gap-1 inline-flex">
      <div className="flex items-center space-x-1.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            type="button"
            key={star}
            disabled={readOnly}
            onClick={() => !readOnly && onChange && onChange(star)}
            onMouseEnter={() => !readOnly && setHoverValue(star)}
            onMouseLeave={() => !readOnly && setHoverValue(0)}
            className={`transition-all duration-150 transform ${
              readOnly 
                ? 'cursor-default' 
                : 'cursor-pointer hover:scale-125 focus:outline-none'
            }`}
          >
            <FaStar
              className={`${starSizes[size] || starSizes.md} transition-colors ${
                star <= activeValue
                  ? 'text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.75)]'
                  : 'text-gray-200 hover:text-yellow-200'
              }`}
            />
          </button>
        ))}
        {showLabel && (
          <span className="ml-2 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
            {experienceLabels[activeValue] || `${activeValue} / 5 Stars`}
          </span>
        )}
      </div>
    </div>
  );
};

export default StarRating;