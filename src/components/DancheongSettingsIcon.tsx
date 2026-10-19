import React from 'react';

interface DancheongSettingsIconProps {
  className?: string;
}

/**
 * Flat 2D Korean Palace Rosette (Dancheong / 단청) & Lotus Blossom (연화문) Settings Gear Icon.
 * Engineered for maximum contrast and instant "Settings Cog + Joseon Lotus" recognition at 24-32px:
 * - 8 symmetrically arranged rounded gear-tooth petals on the outer contour
 * - Authentic flat Dancheong palette:
 *   • Navy Blue (청색 #1E3D59) & Jade Sea-Green (옥색 #38937A) outer gear-lotus ring
 *   • Vibrant Vermilion Orange (#E87A30) & Crimson Red (적색 #C93B32) inner rosette
 *   • Crisp Yellow (황색 #F5C542) and White (백색 #FAF7F2) dividing lines & center axle core
 */
export const DancheongSettingsIcon: React.FC<DancheongSettingsIconProps> = ({
  className = 'w-6 h-6',
}) => {
  const angles = [0, 45, 90, 135, 180, 225, 270, 315];

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* 1. Outer 8-Tooth Gear / Lotus Silhouette Base in Deep Navy Blue (청색) */}
      <g>
        {angles.map((deg) => (
          <rect
            key={`outer-tooth-${deg}`}
            x="11.5"
            y="1.2"
            width="9"
            height="29.6"
            rx="3.2"
            transform={`rotate(${deg} 16 16)`}
            fill="#1E3D59"
            stroke="#FAF7F2"
            strokeWidth="0.9"
          />
        ))}
      </g>

      {/* 2. Concentric Navy Disc connecting the gear teeth */}
      <circle cx="16" cy="16" r="11.8" fill="#1E3D59" />

      {/* 3. 8 Jade Sea-Green (옥색) Gear-Petal Inserts with Yellow (황색) Accents */}
      <g>
        {angles.map((deg) => (
          <rect
            key={`jade-petal-${deg}`}
            x="12.7"
            y="2.4"
            width="6.6"
            height="27.2"
            rx="2.4"
            transform={`rotate(${deg} 16 16)`}
            fill="#38937A"
          />
        ))}
      </g>

      {/* 4. Navy Blue Structural Ring with Crisp Yellow (황색) Border */}
      <circle
        cx="16"
        cy="16"
        r="10.2"
        fill="#1E3D59"
        stroke="#F5C542"
        strokeWidth="1.1"
      />

      {/* 5. 8 Symmetrical Radial Dividing Lines in White (백색) */}
      <g stroke="#FAF7F2" strokeWidth="1" strokeLinecap="round">
        <line x1="16" y1="5.8" x2="16" y2="26.2" />
        <line x1="5.8" y1="16" x2="26.2" y2="16" />
        <line x1="8.8" y1="8.8" x2="23.2" y2="23.2" />
        <line x1="23.2" y1="8.8" x2="8.8" y2="23.2" />
      </g>

      {/* 6. Inner Orange-Vermilion (주황) 8-Petal Lotus Ring */}
      <g>
        {angles.map((deg) => (
          <rect
            key={`inner-orange-${deg}`}
            x="13.2"
            y="7.6"
            width="5.6"
            height="16.8"
            rx="2.6"
            transform={`rotate(${deg} 16 16)`}
            fill="#E87A30"
          />
        ))}
      </g>

      {/* 7. Inner Crimson Red (적색) Lotus Core Disc with White Accent Rim */}
      <circle
        cx="16"
        cy="16"
        r="6.6"
        fill="#C93B32"
        stroke="#FAF7F2"
        strokeWidth="1"
      />

      {/* 8. Central Gear Axle & Lotus Seedpod (Yellow Rim + Navy Core) */}
      <circle
        cx="16"
        cy="16"
        r="3.4"
        fill="#1E3D59"
        stroke="#F5C542"
        strokeWidth="1.4"
      />
      <circle cx="16" cy="16" r="1.2" fill="#FAF7F2" />
    </svg>
  );
};
