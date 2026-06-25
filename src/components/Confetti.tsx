'use client';

import { useEffect, useRef } from 'react';

export function Confetti({ fire }: { fire: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<any[]>([]);
  const animatingRef = useRef(false);
  const animateRef = useRef<() => void>(() => {});

  // Define the animate function in a ref so it can self-reference
  useEffect(() => {
    animateRef.current = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;
      animatingRef.current = true;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current = particlesRef.current.filter((p) => p.life > 0);
      particlesRef.current.forEach((p) => {
        p.vy += p.g;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.life -= 0.012;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });
      if (particlesRef.current.length > 0) {
        requestAnimationFrame(() => animateRef.current());
      } else {
        animatingRef.current = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    if (fire === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const colors = ['#4f8ef7', '#3ecf8e', '#f59e0b', '#ef4444', '#a78bfa', '#f472b6'];
    for (let i = 0; i < 80; i++) {
      particlesRef.current.push({
        x: window.innerWidth / 2 + (Math.random() - 0.5) * 200,
        y: window.innerHeight / 2,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * -10 - 3,
        g: 0.3,
        size: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rot: Math.random() * 360,
        vr: (Math.random() - 0.5) * 15,
        life: 1,
      });
    }
    if (!animatingRef.current) animateRef.current();
  }, [fire]);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[9999]" />;
}
