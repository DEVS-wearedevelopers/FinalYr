import React from 'react';

type Status = 'SAFE' | 'VIGILANT' | 'CRITICAL';

export function ZoneStatusShield({ status }: { status: Status }) {
  const colorMap = {
    SAFE: '#16A34A',
    VIGILANT: '#CA8A04',
    CRITICAL: '#DC2626',
  };
  const color = colorMap[status];

  return (
    <div className="flex justify-center items-center p-8">
      <svg
        width="120"
        height="140"
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill={`${color}20`} />
      </svg>
    </div>
  );
}
