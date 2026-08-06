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

        function drawCircle() {
          p.background(0);
          const diameter = p.map(p.mouseY + p.mouseX, 0, p.height, 20, 300);
          const themeColor = getComputedStyle(document.documentElement)
            .getPropertyValue("--color-primary")
            .trim();
          p.fill(themeColor);
          p.circle(p.width / 2, p.height / 2, diameter);
        }

        p.setup = () => {
          const canvas = p.createCanvas(720, 400);
          canvas.parent(container);
          p.noStroke();
          if (reduceMotion) p.noLoop();
          canvas.elt.addEventListener("touchmove", () => {
            if (reduceMotion) p.redraw();
          }, { passive: true });
        };

        p.draw = drawCircle;
        p.mouseMoved = () => {
          if (reduceMotion) p.redraw();
        };
      });
    });

    return () => {
      disposed = true;
      sketch?.remove();
    };
  }, []);

  return <div ref={containerRef} className="breathing-animation" role="img" aria-label="Interaktive Atemanimation" />;
}
