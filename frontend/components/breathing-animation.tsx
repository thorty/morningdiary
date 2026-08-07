"use client";

import React, { useEffect, useRef } from "react";

type P5Constructor = typeof import("p5").default;

export function BreathingAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (window.navigator.userAgent.includes("jsdom")) return;

    let sketch: import("p5").default | undefined;
    let disposed = false;

    void import("p5").then(({ default: p5 }: { default: P5Constructor }) => {
      if (disposed) return;

      sketch = new p5((p) => {
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const duration = 30_000;
        let startTime = 0;

        function drawBreath() {
          const theme = getComputedStyle(document.documentElement);
          const background = theme.getPropertyValue("--color-surface").trim();
          const outerColor = p.color(theme.getPropertyValue("--color-orb-end").trim());
          const middleColor = p.color(theme.getPropertyValue("--color-orb-middle").trim());
          const innerColor = theme.getPropertyValue("--color-orb-start").trim();
          outerColor.setAlpha(80);
          middleColor.setAlpha(180);

          p.background(background);

          const elapsed = reduceMotion ? 0 : p.millis() - startTime;
          const cycle = (elapsed / duration) % 1;
          const breath = (p.sin(p.TWO_PI * 3 * cycle - p.HALF_PI) + 1) / 2;
          const radius = p.lerp(80, 140, breath);

          const context = p.drawingContext as CanvasRenderingContext2D;
          context.shadowBlur = 80;
          context.shadowColor = outerColor.toString();
          p.fill(outerColor);
          p.circle(p.width / 2, p.height / 2, radius * 2);

          context.shadowBlur = 0;
          p.fill(middleColor);
          p.circle(p.width / 2, p.height / 2, radius * 1.85);
          p.fill(innerColor);
          p.circle(p.width / 2, p.height / 2, radius * 1.65);
        }

        p.setup = () => {
          const canvas = p.createCanvas(720, 400);
          canvas.parent(container);
          p.noStroke();
          startTime = p.millis();
          if (reduceMotion) p.noLoop();
        };

        p.draw = drawBreath;
      });
    });

    return () => {
      disposed = true;
      sketch?.remove();
    };
  }, []);

  return <div ref={containerRef} className="breathing-animation" role="img" aria-label="Interaktive Atemanimation" />;
}
