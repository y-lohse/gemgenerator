import { SVG } from "@svgdotjs/svg.js";
import { useEffect, useRef, useState } from "react";
import { SliderSetting } from "./components/sliderSetting";
import { evenlySpacedEllipsePoints } from "./ellipse";
import BezierEasing from "bezier-easing";

function App() {
  const drawAreaRef = useRef<HTMLDivElement | null>(null);

  const [sides, setSides] = useState(6);
  const [widthFactor, setWidthFactor] = useState(0.5);
  const [heightFactor, setHeightFactor] = useState(0.7);
  const [stepsCount, setStepsCount] = useState(2);
  const [initialSpread, setInitialSpread] = useState(0.5);
  const [finalSpread, setFinalSpread] = useState(0.5);

  const maxSteps = Math.round((Math.min(widthFactor, heightFactor) - 0.2) * 10);

  useEffect(
    function reduceStepsIfNeeded() {
      if (stepsCount > maxSteps) {
        setStepsCount(maxSteps);
      }
    },
    [maxSteps, stepsCount],
  );

  useEffect(() => {
    if (!drawAreaRef.current) return;
    const size = drawAreaRef.current.getBoundingClientRect();
    const { width: sceneWidth, height: sceneHeight } = size;

    const draw = SVG().addTo(drawAreaRef.current).size(sceneWidth, sceneHeight);

    const renderOffsetX = sceneWidth / 2;
    const renderOffsetY = sceneHeight / 2;

    const maxWidth = sceneWidth / 2.4;
    const maxHeight = sceneHeight / 2.4;

    const availableSpaceForSteps = Math.min(widthFactor, heightFactor) - 0.1;
    const easing = BezierEasing(0, initialSpread, 1, finalSpread);

    for (let i = 0; i < stepsCount; i++) {
      const t = i / maxSteps;

      const stepWidthFactor = widthFactor - easing(t) * availableSpaceForSteps;
      const stepHeightFactor =
        heightFactor - easing(t) * availableSpaceForSteps;
      const points = evenlySpacedEllipsePoints(
        maxWidth * stepWidthFactor,
        maxHeight * stepHeightFactor,
        sides,
        3 * (Math.PI / 2),
      );
      const path = points.map((p, i) =>
        i === 0
          ? `M${renderOffsetX + p[0]},${renderOffsetY + p[1]}`
          : `L${renderOffsetX + p[0]},${renderOffsetY + p[1]}`,
      );
      path.push("Z");
      draw
        .path(path.join(" "))
        .fill("none")
        .stroke({ width: 1, color: "#000" });
    }

    return () => {
      draw.remove();
    };
  }, [
    drawAreaRef,
    finalSpread,
    heightFactor,
    initialSpread,
    maxSteps,
    sides,
    stepsCount,
    widthFactor,
  ]);

  const minScaleFactor = 0.3;

  return (
    <div className="h-screen max-h-screen flex flex-col lg:flex-row justify-center items-stretch overflow-hidden">
      <div className="flex-1  bg-stone-200 flex justify-center items-center">
        <div ref={drawAreaRef} className="h-full aspect-square"></div>
      </div>
      <div className="flex-1  bg-slate-950 text-primary-foreground overflow-auto">
        <div className="max-w-md mx-auto p-6 flex flex-col gap-8">
          <SliderSetting
            label="Sides"
            value={sides}
            onChange={setSides}
            min={3}
            max={12}
          />
          <SliderSetting
            label="Width"
            value={widthFactor}
            onChange={setWidthFactor}
            min={minScaleFactor}
            max={1}
            step={0.1}
          />
          <SliderSetting
            label="Height"
            value={heightFactor}
            onChange={setHeightFactor}
            min={minScaleFactor}
            max={1}
            step={0.1}
          />
          <SliderSetting
            label="Steps"
            value={stepsCount}
            onChange={setStepsCount}
            min={2}
            max={maxSteps}
          />
          <SliderSetting
            label="Initial Spread"
            value={initialSpread}
            onChange={setInitialSpread}
            min={0}
            max={0.9}
            step={0.1}
          />
          <SliderSetting
            label="Final Spread"
            value={finalSpread}
            onChange={setFinalSpread}
            min={0}
            max={0.9}
            step={0.1}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
