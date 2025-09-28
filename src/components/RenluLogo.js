import React from 'react';

const RenluLogo = ({ 
  size = 32, 
  className = "", 
  variant = "default", // "default", "white", "dark"
  showText = true 
}) => {
  const logoSize = size;
  const textSize = size * 0.75;
  
  const getColors = () => {
    switch (variant) {
      case 'white':
        return {
          bg: 'white',
          text: 'white',
          logoText: '#1e293b'
        };
      case 'dark':
        return {
          bg: '#1e293b',
          text: '#1e293b',
          logoText: 'white'
        };
      default:
        return {
          bg: '#1e293b',
          text: '#1e293b',
          logoText: 'white'
        };
    }
  };
  
  const colors = getColors();
  
  return (
    <div className={`flex items-center ${className}`}>
      {/* Text only */}
      <span 
        className="font-bold"
        style={{ 
          fontSize: size,
          color: colors.text
        }}
      >
        renlu
      </span>
    </div>
  );
};

export default RenluLogo;
