"use client";

import { useEffect, useRef } from "react";

interface FluidBackgroundProps {
  isAnimating: boolean;
}

type Blob = {
  color: string;
  opacity: number;
  phase: number;
  radius: number;
  stretch: number;
  x: number;
  y: number;
};

const BLOBS: Blob[] = [
  { color: "--brillo", opacity: 0.85, phase: 0, radius: 0.56, stretch: 0.66, x: 0.62, y: 0.43 },
  { color: "--brillo-2", opacity: 0.72, phase: 1.8, radius: 0.48, stretch: 0.72, x: 0.34, y: 0.66 },
  { color: "--signal", opacity: 0.2, phase: 3.7, radius: 0.38, stretch: 0.82, x: 0.72, y: 0.7 },
];

export function FluidBackground({ isAnimating }: FluidBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const rootStyles = getComputedStyle(document.documentElement);
    const colors = new Map(
      BLOBS.map((blob) => [blob.color, rootStyles.getPropertyValue(blob.color).trim()]),
    );
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let lastFrame = 0;
    let width = 0;
    let height = 0;

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      width = bounds.width;
      height = bounds.height;
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const drawBlob = (blob: Blob, time: number) => {
      const drift = time / 1000;
      const x =
        width *
        (blob.x +
          Math.sin(drift * 0.22 + blob.phase) * 0.12 +
          Math.cos(drift * 0.11 + blob.phase) * 0.04);
      const y = height * (blob.y + Math.cos(drift * 0.19 + blob.phase) * 0.15);
      const radius = Math.max(width, height) * blob.radius;
      const color = colors.get(blob.color) || "transparent";

      context.save();
      context.translate(x, y);
      context.scale(1, blob.stretch);
      context.globalAlpha = blob.opacity;
      context.globalCompositeOperation = "screen";

      const gradient = context.createRadialGradient(0, 0, 0, 0, 0, radius);
      gradient.addColorStop(0, color);
      gradient.addColorStop(0.35, color);
      gradient.addColorStop(0.78, "transparent");
      context.fillStyle = gradient;
      context.fillRect(-radius, -radius, radius * 2, radius * 2);
      context.restore();
    };

    const draw = (time: number) => {
      if (!width || !height) return;

      context.clearRect(0, 0, width, height);
      BLOBS.forEach((blob) => drawBlob(blob, time));
    };

    const animate = (time: number) => {
      if (time - lastFrame >= 33) {
        draw(time);
        lastFrame = time;
      }
      frame = window.requestAnimationFrame(animate);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    if (isAnimating && !prefersReducedMotion) {
      frame = window.requestAnimationFrame(animate);
    } else {
      context.clearRect(0, 0, width, height);
    }

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [isAnimating]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={
        isAnimating
          ? "pointer-events-none absolute inset-0 -z-[5] size-full"
          : "pointer-events-none absolute inset-0 -z-[5] size-full opacity-0"
      }
    />
  );
}
