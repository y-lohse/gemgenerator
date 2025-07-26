import { SVG } from "@svgdotjs/svg.js";
import { useEffect, useRef, useState } from "react";
import { findEvenlySpacedPoints, generateAllPoints } from "./bezier";
import { evenlySpacedEllipsePoints } from "./ellipse";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

function App() {
  const drawAreaRef = useRef<HTMLDivElement | null>(null);

  const [sides, setSides] = useState(6);

  useEffect(() => {
    if (!drawAreaRef.current) return;
    const size = drawAreaRef.current.getBoundingClientRect();
    const { width, height } = size;

    const draw = SVG().addTo(drawAreaRef.current).size(width, height);

    const renderOffsetX = width / 2;
    const renderOffsetY = height / 2;

    const points = evenlySpacedEllipsePoints(
      100,
      100,
      sides,
      3 * (Math.PI / 2),
    ).map((p) => ({
      x: p[0],
      y: p[1],
    }));

    const path = points.map((p, i) =>
      i === 0
        ? `M${renderOffsetX + p.x},${renderOffsetY + p.y}`
        : `L${renderOffsetX + p.x},${renderOffsetY + p.y}`,
    );
    path.push("Z");
    draw.path(path.join(" ")).fill("none").stroke({ width: 1, color: "#000" });

    return () => {
      draw.remove();
    };
  }, [drawAreaRef, sides]);

  return (
    <div className="h-screen max-h-screen flex flex-col lg:flex-row overflow-hidden">
      <div className="flex-1  bg-stone-200 flex justify-center items-center">
        <div ref={drawAreaRef} className="w-full aspect-square "></div>
      </div>
      <div className="flex-1 shrink-0  bg-slate-950 text-primary-foreground">
        <div className="max-w-md mx-auto p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-row justify-between">
              <Label htmlFor="email">Sides</Label>
              <span className="text-muted-foreground">{sides}</span>
            </div>
            <Slider
              value={[sides]}
              onValueChange={(value) => setSides(value[0])}
              min={3}
              max={30}
              step={1}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
