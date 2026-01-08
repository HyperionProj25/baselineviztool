import React from 'react';

const BaselineLogo = ({ size = 'w-32 h-32' }) => {
  const bars = [
    { x: 30, y: 51 },
    { x: 40, y: 57 },
    { x: 50, y: 61 },
    { x: 60, y: 57 },
    { x: 70, y: 51 }
  ];

  return (
    <div className={size + ' mx-auto relative'}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <path
          d="M80,20 L80,50 L50,70 L20,50 L20,20"
          fill="none"
          stroke="#f6e1bd"
          strokeWidth="2"
        />
        <line x1="20" y1="20" x2="26" y2="20" stroke="#f6e1bd" strokeWidth="2" />
        <line x1="74" y1="20" x2="80" y2="20" stroke="#f6e1bd" strokeWidth="2" />
        <text
          x="50"
          y="20"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="9"
          fontWeight="bold"
          fill="#f6e1bd"
        >
          BASELINE
        </text>
        <circle cx="20" cy="20" r="3" fill="#f6e1bd" />
        <circle cx="80" cy="20" r="3" fill="#f6e1bd" />
        <circle cx="20" cy="50" r="3" fill="#f6e1bd" />
        <circle cx="80" cy="50" r="3" fill="#f6e1bd" />
        <circle cx="50" cy="70" r="3" fill="#f6e1bd" />
        {bars.map((pos, i) => (
          <g key={i}>
            <line
              x1={pos.x}
              y1={pos.y - 25}
              x2={pos.x}
              y2={pos.y}
              stroke="#cb6b1e"
              strokeWidth="2"
              style={{
                animation: 'waveUp 1s ease-in-out infinite',
                animationDelay: i * 0.2 + 's',
                transformOrigin: pos.x + 'px ' + pos.y + 'px'
              }}
            />
            <circle cx={pos.x} cy={pos.y} r="2.5" fill="#cb6b1e" />
          </g>
        ))}
      </svg>
    </div>
  );
};

export default BaselineLogo;
