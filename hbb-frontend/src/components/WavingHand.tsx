"use client";

import React, { useEffect, useState } from 'react';

interface WavingHandProps {
  message?: string;
}

const WavingHand: React.FC<WavingHandProps> = ({ message = "Welcome!" }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isTextVisible, setIsTextVisible] = useState(true);

  useEffect(() => {
    const disappearTimer = setTimeout(() => {
      setIsVisible(false);
    }, 3000);

    const textTimer = setTimeout(() => {
      setIsTextVisible(false); 
    }, 2500);

    return () => {
      clearTimeout(disappearTimer);
      clearTimeout(textTimer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <span className="inline-flex items-center 2xl:text-32px lg:text-3xl text-lg capitalize">
      <span className={`
        mr-2 
        transition-opacity 
        duration-500
        animate-slideIn
        ${isTextVisible ? 'opacity-100' : 'opacity-0'}
        
      `}>
        {message}
      </span>
      <span className="inline-block wave-animation">
        👋
      </span>
    </span>
  );
};

export default WavingHand;