import React from 'react';

interface NexisLogoProps {
  className?: string;
}

export const NexisLogo: React.FC<NexisLogoProps> = ({ className = 'w-8 h-8' }) => {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="Nexis logo"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="nexis-core" x1="10" y1="8" x2="54" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#adc6ff" />
          <stop offset="0.55" stopColor="#4d8eff" />
          <stop offset="1" stopColor="#d0bcff" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="26" stroke="url(#nexis-core)" strokeWidth="2" opacity="0.35" />
      <path d="M16 35c5-8 10-12 16-12s11 4 16 12" stroke="#89ceff" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
      <path d="M18 43c4-5 8-7.5 14-7.5S42 38 46 43" stroke="#d0bcff" strokeWidth="2" strokeLinecap="round" opacity="0.65" />
      <path d="M20 25h8l8 14h8" stroke="url(#nexis-core)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="20" cy="25" r="3.5" fill="#adc6ff" />
      <circle cx="32" cy="32" r="7" fill="#05070a" stroke="url(#nexis-core)" strokeWidth="3" />
      <circle cx="44" cy="39" r="3.5" fill="#d0bcff" />
      <circle cx="32" cy="32" r="2.5" fill="#89ceff" />
    </svg>
  );
};
