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
    const renderOffsetY = height / 2 - 100;

    const renderPointsCount = 100;
    const a = 1.00005507808;
    const b = 0.55342925736;
    const c = 0.99873327689;
    const radius = 150;
    const pointsArc1 = generateAllPoints(
      0,
      0,
      radius * b,
      radius - radius * c,
      radius * c,
      radius - radius * b,
      radius * a,
      radius * a,
      renderPointsCount,
    );
    const pointsArc2 = pointsArc1.map((p) => ({
      x: -p.y + 150,
      y: p.x + 150,
    }));
    const pointsArc3 = pointsArc1.map((p) => ({
      x: -p.x,
      y: -p.y + 300,
    }));
    const pointsArc4 = pointsArc1.map((p) => ({
      x: p.y - 150,
      y: -p.x + 150,
    }));

    const allPoints = [
      ...pointsArc1,
      ...pointsArc2,
      ...pointsArc3,
      ...pointsArc4,
    ];
    const points = findEvenlySpacedPoints(allPoints, sides);
    //
    // const points = evenlySpacedEllipsePoints(
    //   100,
    //   100,
    //   sides,
    //   3 * (Math.PI / 2),
    // ).map((p) => ({
    //   x: p[0],
    //   y: p[1],
    // }));

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
