import React from 'react';

interface SpaceshipAnimationProps {
  show: boolean;
  animationKey: number;
}

export const SpaceshipAnimation: React.FC<SpaceshipAnimationProps> = ({ show, animationKey }) => {
  if (!show) return null;

  return (
    <div className="spaceship-container">
      <div key={animationKey} className="spaceship spaceship--launch">
        {/* Energy Trail */}
        <div className="spaceship-trail"></div>
        
        {/* Main Spaceship */}
        <div className="spaceship-body">
          <svg className="spaceship-svg" viewBox="0 0 60 25" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Main Hull */}
            <path 
              d="M8 12.5 C 15 8, 25 8, 35 10 C 45 12, 55 12, 58 12.5 C 55 13, 45 13, 35 15 C 25 17, 15 17, 8 12.5 Z" 
              fill="#1e3a8a" 
              stroke="#3b82f6" 
              strokeWidth="0.5"
            />
            
            {/* Command Module */}
            <ellipse cx="18" cy="12.5" rx="6" ry="3" fill="#2563eb" stroke="#60a5fa" strokeWidth="0.3"/>
            
            {/* Engine Nacelles */}
            <ellipse cx="45" cy="10" rx="8" ry="1.5" fill="#1d4ed8" stroke="#3b82f6" strokeWidth="0.3"/>
            <ellipse cx="45" cy="15" rx="8" ry="1.5" fill="#1d4ed8" stroke="#3b82f6" strokeWidth="0.3"/>
            
            {/* Engine Glow Effects */}
            <ellipse cx="52" cy="10" rx="3" ry="1" fill="#06b6d4" opacity="0.8">
              <animate attributeName="opacity" values="0.6;1;0.6" dur="0.8s" repeatCount="indefinite"/>
            </ellipse>
            <ellipse cx="52" cy="15" rx="3" ry="1" fill="#06b6d4" opacity="0.8">
              <animate attributeName="opacity" values="0.6;1;0.6" dur="0.8s" repeatCount="indefinite"/>
            </ellipse>
            
            {/* Plasma Drive Effects */}
            <ellipse cx="8" cy="12.5" rx="2" ry="1.5" fill="#f59e0b">
              <animate attributeName="opacity" values="0.6;1;0.6" dur="0.8s" repeatCount="indefinite"/>
            </ellipse>
            <ellipse cx="12" cy="16" rx="2.5" ry="1" fill="#3b82f6">
              <animate attributeName="opacity" values="0.6;1;0.6" dur="0.8s" repeatCount="indefinite"/>
            </ellipse>
            
            {/* Engine Glow */}
            <ellipse cx="9" cy="9" rx="3" ry="1.5" fill="#06b6d4" opacity="0.5">
              <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1.2s" repeatCount="indefinite"/>
            </ellipse>
            
            {/* Navigation Lights */}
            <circle cx="20" cy="8" r="0.8" fill="#ef4444">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite"/>
            </circle>
            <circle cx="20" cy="17" r="0.8" fill="#22c55e">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="2.2s" repeatCount="indefinite"/>
            </circle>
            
            {/* Energy Field Lines */}
            <line x1="22" y1="11" x2="43" y2="11" stroke="#3b82f6" strokeWidth="0.4" opacity="0.4">
              <animate attributeName="opacity" values="0.2;0.7;0.2" dur="1.8s" repeatCount="indefinite"/>
            </line>
            <line x1="22" y1="14" x2="43" y2="14" stroke="#3b82f6" strokeWidth="0.4" opacity="0.4">
              <animate attributeName="opacity" values="0.2;0.7;0.2" dur="1.8s" repeatCount="indefinite"/>
            </line>
            
            {/* Antenna Array */}
            <rect x="57" y="11.5" width="3" height="2" fill="#64748b" stroke="#334155" strokeWidth="0.2"/>
            <line x1="56" y1="10" x2="56" y2="14.5" stroke="#64748b" strokeWidth="0.2"/>
            <line x1="55" y1="9.5" x2="55" y2="15" stroke="#64748b" strokeWidth="0.2"/>
            
            {/* Hull Paneling */}
            <rect x="28" y="11" width="12" height="3" fill="none" stroke="#475569" strokeWidth="0.2" opacity="0.6"/>
          </svg>
        </div>
      </div>
    </div>
  );
};