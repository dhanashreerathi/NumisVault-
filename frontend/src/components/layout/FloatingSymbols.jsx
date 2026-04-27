import { useEffect, useRef } from 'react';

const SYMBOLS = ['₹', '$', '€', '£', '¥', '₽', '₿', '₣', '₩', '₫', '¢'];

export default function FloatingSymbols({ hidden }) {
  const containerRef = useRef(null);
  const built = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || built.current) return;
    built.current = true;

    for (let i = 0; i < 45; i++) {
      const span = document.createElement('span');
      span.className = 'symbol';
      span.innerText = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];

      const startX    = Math.random() * 100;
      const startY    = Math.random() * 100;
      const moveX     = (Math.random() - 0.5) * 120;
      const moveY     = (Math.random() - 0.5) * 120;
      const duration  = 15 + Math.random() * 20;
      const rotation  = (Math.random() - 0.5) * 720;
      const fontSize  = 14 + Math.random() * 25;
      const maxOpacity = 0.10 + Math.random() * 0.20;

      span.style.left     = `${startX}vw`;
      span.style.top      = `${startY}vh`;
      span.style.fontSize = `${fontSize}px`;
      span.style.setProperty('--mx',          `${moveX}vw`);
      span.style.setProperty('--my',          `${moveY}vh`);
      span.style.setProperty('--dur',         `${duration}s`);
      span.style.setProperty('--rot',         `${rotation}deg`);
      span.style.setProperty('--max-opacity', maxOpacity);
      span.style.animationDelay = `-${Math.random() * 50}s`;

      container.appendChild(span);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={`floating-symbols${hidden ? ' hidden' : ''}`}
    />
  );
}
