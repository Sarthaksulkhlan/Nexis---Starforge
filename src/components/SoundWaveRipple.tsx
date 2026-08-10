import React, { useEffect, useRef } from 'react';

interface SoundWaveRippleProps {
  isHoveringCta?: boolean;
  pulseTrigger?: number;
}

interface Ring {
  radius: number;
  maxRadius: number;
  speed: number;
  opacity: number;
  maxOpacity: number;
  color: string;
  lineWidth: number;
}

export const SoundWaveRipple: React.FC<SoundWaveRippleProps> = ({
  isHoveringCta = false,
  pulseTrigger = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pulseTriggerRef = useRef(pulseTrigger);

  useEffect(() => {
    pulseTriggerRef.current = pulseTrigger;
  }, [pulseTrigger]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Check for prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Color palette for AURA Voice Core sound waves
    const colors = ['rgba(77, 142, 255, ', 'rgba(173, 198, 255, ', 'rgba(168, 85, 247, '];

    // Initialize concentric rings
    const numRings = 6;
    const rings: Ring[] = [];

    const getOrigin = () => {
      // Position origin near central AURA Voice Core (70% width on lg desktop, 50% on mobile)
      const x = width >= 1024 ? width * 0.72 : width * 0.5;
      const y = width >= 1024 ? Math.min(height * 0.45, 420) : Math.min(height * 0.38, 380);
      return { x, y };
    };

    const maxR = Math.max(width, height) * 0.9;

    for (let i = 0; i < numRings; i++) {
      rings.push({
        radius: (i / numRings) * maxR,
        maxRadius: maxR,
        speed: 0.8 + Math.random() * 0.3,
        opacity: 0,
        maxOpacity: 0.18 + Math.random() * 0.08,
        color: colors[i % colors.length],
        lineWidth: 1.5 + (i % 2) * 0.8,
      });
    }

    // Extra pulse rings generated on click interaction
    const extraPulseRings: Ring[] = [];

    let lastPulseTime = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const { x: originX, y: originY } = getOrigin();

      if (prefersReducedMotion) {
        // Draw static subtle concentric rings if reduced motion is preferred
        const staticRings = [120, 260, 420, 600];
        staticRings.forEach((r, idx) => {
          ctx.beginPath();
          ctx.arc(originX, originY, r, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(77, 142, 255, ${0.08 - idx * 0.015})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        });
        return;
      }

      // Check if pulseTrigger was updated
      if (pulseTriggerRef.current > lastPulseTime && pulseTriggerRef.current > 0) {
        lastPulseTime = pulseTriggerRef.current;
        // Add a vibrant burst pulse
        extraPulseRings.push({
          radius: 20,
          maxRadius: maxR * 1.1,
          speed: 4.5,
          opacity: 0.4,
          maxOpacity: 0.4,
          color: 'rgba(173, 198, 255, ',
          lineWidth: 3,
        });
      }

      // Speed multiplier when hovering CTA button
      const speedMultiplier = isHoveringCta ? 1.6 : 1.0;

      // Draw primary continuous rings
      rings.forEach((ring) => {
        ring.radius += ring.speed * speedMultiplier;

        if (ring.radius > ring.maxRadius) {
          ring.radius = 0;
        }

        // Calculate smooth fade-in near center and fade-out near max radius
        const progress = ring.radius / ring.maxRadius; // 0 to 1
        let currentOpacity = 0;

        if (progress < 0.15) {
          currentOpacity = (progress / 0.15) * ring.maxOpacity;
        } else if (progress > 0.6) {
          currentOpacity = ((1 - progress) / 0.4) * ring.maxOpacity;
        } else {
          currentOpacity = ring.maxOpacity;
        }

        if (isHoveringCta) {
          currentOpacity = Math.min(0.35, currentOpacity * 1.4);
        }

        if (currentOpacity > 0.005) {
          ctx.beginPath();
          ctx.arc(originX, originY, ring.radius, 0, Math.PI * 2);
          ctx.strokeStyle = `${ring.color}${currentOpacity.toFixed(3)})`;
          ctx.lineWidth = isHoveringCta ? ring.lineWidth + 0.5 : ring.lineWidth;
          
          // Subtle audio wave dash pattern for realism
          if (ring.radius > 150) {
            ctx.setLineDash([120, 8, 200, 12]);
          } else {
            ctx.setLineDash([]);
          }

          ctx.stroke();
          ctx.setLineDash([]);
        }
      });

      // Draw interactive pulse rings
      for (let i = extraPulseRings.length - 1; i >= 0; i--) {
        const pRing = extraPulseRings[i];
        pRing.radius += pRing.speed;

        const progress = pRing.radius / pRing.maxRadius;
        const currentOpacity = (1 - progress) * pRing.maxOpacity;

        if (progress >= 1 || currentOpacity <= 0) {
          extraPulseRings.splice(i, 1);
        } else {
          ctx.beginPath();
          ctx.arc(originX, originY, pRing.radius, 0, Math.PI * 2);
          ctx.strokeStyle = `${pRing.color}${currentOpacity.toFixed(3)})`;
          ctx.lineWidth = pRing.lineWidth;
          ctx.stroke();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isHoveringCta]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0 w-full h-full"
      style={{ opacity: 0.85 }}
    />
  );
};
