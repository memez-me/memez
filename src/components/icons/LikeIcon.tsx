import React from 'react';

type LikeIconProps = {
  className?: string;
  isActive?: boolean;
  size?: number | string;
  height?: number | string;
};

function LikeIcon({ className, isActive, size = 24 }: LikeIconProps) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      {isActive ? (
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 5.52422L12.765 4.70229C14.8777 2.43257 18.3029 2.43257 20.4155 4.70229C22.5282 6.972 22.5282 10.6519 20.4155 12.9217L13.5301 20.3191C12.685 21.227 11.3149 21.227 10.4699 20.3191L3.58447 12.9217C1.47184 10.6519 1.47184 6.972 3.58447 4.70229C5.69709 2.43257 9.12233 2.43257 11.235 4.70229L12 5.52422ZM17 5.25C16.5858 5.25 16.25 5.58579 16.25 6C16.25 6.41421 16.5858 6.75 17 6.75C17.6904 6.75 18.25 7.30964 18.25 8C18.25 8.41421 18.5858 8.75 19 8.75C19.4142 8.75 19.75 8.41421 19.75 8C19.75 6.48122 18.5188 5.25 17 5.25Z"
          fill="#00FF85"
        />
      ) : (
        <path
          d="M12.6851 5.00005L12 5.70259L11.315 5.00007C9.18404 2.81478 5.72912 2.81477 3.5982 5.00007C1.5245 7.12667 1.46078 10.5539 3.45393 12.76L9.18026 19.0982C10.7015 20.782 13.2984 20.782 14.8197 19.0982L20.5461 12.76C22.5392 10.5538 22.4755 7.12665 20.4018 5.00005C18.2709 2.81476 14.816 2.81476 12.6851 5.00005Z"
          stroke="#00FF8566"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

export default LikeIcon;
