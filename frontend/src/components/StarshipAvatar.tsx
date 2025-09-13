import React from "react";

// StarshipAvatar.tsx
// A self-contained React component that renders a
// stylized starship avatar with idle hover and a "traveling" launch animation.
//
// Props:
// - isFlying: boolean -> when true, plays the flight animation
// - onComplete?: () => void -> called when the flight animation finishes
// - size?: number -> diameter in px of the avatar container (default 64)

type Props = {
  isFlying?: boolean;
  onComplete?: () => void;
  size?: number;
};

export default function StarshipAvatar({ isFlying = false, onComplete, size = 64 }: Props) {
  const containerSize = size;
  const shipSize = Math.round(size * 0.6);

  // Handle onComplete when animation finishes
  React.useEffect(() => {
    let timeout: number | undefined;
    if (isFlying) {
      // Animation duration is 2.5s
      timeout = window.setTimeout(() => {
        onComplete && onComplete();
      }, 2500);
    }
    return () => {
      if (timeout) window.clearTimeout(timeout);
    };
  }, [isFlying, onComplete]);

  return (
    <div
      aria-hidden
      className="pointer-events-none"
      style={{ width: containerSize, height: containerSize, position: "relative" }}
    >
      {/* Floating container (centered) */}
      <div
        className={`starship-wrapper ${isFlying ? 'starship-wrapper--flying' : 'starship-wrapper--idle'}`}
        style={{ width: containerSize, height: containerSize }}
      >
        {/* glow halo */}
        <div
          className="starship-glow"
          style={{
            width: containerSize * 1.05,
            height: containerSize * 1.05,
          }}
        />

        {/* starship + trail group */}
        <div className="starship-group">
          {/* trail (SVG path) */}
          <svg
            width={Math.max(containerSize, 260)}
            height={Math.max(containerSize, 260)}
            viewBox={`0 0 ${Math.max(containerSize, 260)} ${Math.max(containerSize, 260)}`}
            className="starship-trail"
          >
            <path
              d={"M300 200 C 240 120, 180 120, 120 80"}
              fill="none"
              stroke="rgba(99,102,241,0.85)"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="6 6"
              className={`trail-path ${isFlying ? 'trail-path--flying' : ''}`}
            />
          </svg>

          {/* Ship (SVG) */}
          <svg
            width={shipSize}
            height={shipSize}
            viewBox="0 0 64 64"
            xmlns="http://www.w3.org/2000/svg"
            className={`starship-svg ${isFlying ? 'starship-svg--flying' : ''}`}
          >
            <defs>
              <linearGradient id="thruster" x1="0" x2="1">
                <stop offset="0%" stopColor="#fee2b3" />
                <stop offset="100%" stopColor="#fb923c" />
              </linearGradient>
              <linearGradient id="shipGrad" x1="0" x2="1">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>

            {/* body */}
            <g>
              <path
                d="M32 6 C22 6, 14 14, 14 24 C14 30, 24 44, 32 58 C40 44, 50 30, 50 24 C50 14, 42 6, 32 6 Z"
                fill="url(#shipGrad)"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth={1}
                className={`ship-body ${isFlying ? 'ship-body--flying' : ''}`}
              />

              {/* window */}
              <circle
                cx="32"
                cy="26"
                r="6"
                fill="rgba(255,255,255,0.95)"
                className={`ship-window ${isFlying ? 'ship-window--flying' : ''}`}
              />

              {/* left fin */}
              <path
                d="M18 30 C10 34, 10 42, 18 46"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={2}
                className={`ship-fin-left ${isFlying ? 'ship-fin-left--flying' : ''}`}
              />

              {/* right fin */}
              <path
                d="M46 30 C54 34, 54 42, 46 46"
                fill="none"
                stroke="rgba(0,0,0,0.06)"
                strokeWidth={2}
                className={`ship-fin-right ${isFlying ? 'ship-fin-right--flying' : ''}`}
              />

              {/* thruster flames (appear while flying) */}
              <g className={`ship-thruster ${isFlying ? 'ship-thruster--flying' : ''}`}>
                <path
                  d="M28 58 C30 66, 34 66, 36 58 C34 62, 32 62, 30 58"
                  fill="url(#thruster)"
                />
              </g>
            </g>
          </svg>
        </div>
      </div>

      {/* small badge or status dot */}
      <div
        style={{ position: "absolute", right: 2, bottom: 2 }}
        className="w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-white"
        aria-hidden
      />
    </div>
  );
}