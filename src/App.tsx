import { SVG } from "@svgdotjs/svg.js";
import { useEffect, useRef, useState } from "react";
import { SliderSetting } from "./components/sliderSetting";
import { ToggleSetting } from "./components/toggleSetting";
import {
  evenlySpacedEllipsePoints,
  getAngle,
  getCentroid,
  getVectorLength,
  normalizedAngleDifference,
} from "./ellipse";
import BezierEasing from "bezier-easing";

function App() {
  const drawAreaRef = useRef<HTMLDivElement | null>(null);

  const [sides, setSides] = useState(8);
  const [widthFactor, setWidthFactor] = useState(0.7);
  const [heightFactor, setHeightFactor] = useState(0.7);
  const [levelsCount, setLevelsCount] = useState(4);
  const [outsideSpread, setOutsideSpread] = useState(0);
  const [centerSpread, setCenterSpread] = useState(1);
  const [isPointy, setIsPointy] = useState(false);
  const [useAlternateAngle, setUseAlternateAngle] = useState(false);
  const [lightSourcePosition, setLightSourcePosition] = useState(3);
  const [edgeSmoothness, setEdgeSmoothness] = useState(0.5);

  const maxLevels = Math.round(
    (Math.min(widthFactor, heightFactor) - 0.2) * 10,
  );

  useEffect(
    function reduceLevelsIfNeeded() {
      if (levelsCount > maxLevels) {
        setLevelsCount(maxLevels);
      }
    },
    [maxLevels, levelsCount],
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

    const hasEvenSides = sides % 2 === 0;
    const alternateModifier = hasEvenSides ? 0 : 3;
    const angle = (useAlternateAngle ? alternateModifier : 1) * (Math.PI / 2);

    const availableSpaceForLevels = Math.min(widthFactor, heightFactor) - 0.1;
    const easing = BezierEasing(0, outsideSpread, 1, centerSpread);

    type LevelPoints = Array<[number, number]>;
    const levels: Array<LevelPoints> = [];
    for (let i = 0; i < levelsCount; i++) {
      const t = i / maxLevels;

      const levelWidthFactor =
        widthFactor - easing(t) * availableSpaceForLevels;
      const levelHeightFactor =
        heightFactor - easing(t) * availableSpaceForLevels;
      const points = evenlySpacedEllipsePoints(
        maxWidth * levelWidthFactor,
        maxHeight * levelHeightFactor,
        sides,
        angle,
      );
      levels.push(points);
    }

    type PolyPoints = Array<[number, number]>;
    const faces: Array<PolyPoints> = [];

    for (let i = 0; i < levels.length - 1; i++) {
      for (let j = 0; j < sides; j++) {
        faces.push([
          levels[i][j],
          levels[i + 1][j],
          levels[i + 1][(j + 1) % sides],
          levels[i][(j + 1) % sides],
        ]);
      }
    }

    if (isPointy) {
      for (let i = 0; i < sides; i++) {
        faces.push([
          levels[levels.length - 1][i],
          levels[levels.length - 1][(i + 1) % sides],
          [0, 0],
        ]);
      }
    } else {
      faces.push(levels[levels.length - 1]);
    }

    const lightSourceAngle = lightSourcePosition * (Math.PI / 4);
    const maxDistance = Math.max(maxWidth, maxHeight);

    faces.forEach((polyPoints) => {
      const centroid = getCentroid(polyPoints);
      const centroidAngle = getAngle(centroid[0], centroid[1]);
      const elevation =
        (maxDistance - getVectorLength(centroid[0], centroid[1])) / maxDistance;
      const dimmingEffect =
        normalizedAngleDifference(lightSourceAngle, centroidAngle) *
        (1 - elevation);

      const maxLuminosity = 50;
      const minLuminosity = 10;
      const luminosityVariance = maxLuminosity - minLuminosity;
      const light = maxLuminosity - luminosityVariance * dimmingEffect;

      const strokeMaxLight = luminosityVariance;
      const strokeMinLight = minLuminosity;
      const strokeVariance = strokeMaxLight - strokeMinLight;
      const strokeLight = minLuminosity + strokeVariance * edgeSmoothness;

      draw
        .polygon(
          polyPoints
            .map((p) => `${renderOffsetX + p[0]},${renderOffsetY + p[1]}`)
            .join(" "),
        )
        .css("fill", `hsl(354, 80%, ${light}%)`)
        .css("stroke", `hsl(354, 80%, ${strokeLight}%)`)
        .attr("stroke-width", 1);
    });

    return () => {
      draw.remove();
    };
  }, [
    drawAreaRef,
    centerSpread,
    heightFactor,
    outsideSpread,
    maxLevels,
    sides,
    levelsCount,
    widthFactor,
    isPointy,
    useAlternateAngle,
    lightSourcePosition,
    edgeSmoothness,
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
            label="Light position"
            value={lightSourcePosition}
            onChange={setLightSourcePosition}
            min={0}
            max={7}
            step={0.5}
          />
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
            label="Levels"
            value={levelsCount}
            onChange={setLevelsCount}
            min={2}
            max={maxLevels}
          />
          <SliderSetting
            label="Outside Spread"
            value={outsideSpread}
            onChange={setOutsideSpread}
            min={0}
            max={0.9}
            step={0.1}
          />
          <SliderSetting
            label="Center Spread"
            value={centerSpread}
            onChange={setCenterSpread}
            min={0}
            max={0.9}
            step={0.1}
          />
          <ToggleSetting
            label={"Pointy"}
            value={isPointy}
            onChange={setIsPointy}
          />
          <ToggleSetting
            label={"Alternate angle"}
            value={useAlternateAngle}
            onChange={setUseAlternateAngle}
          />
          <SliderSetting
            label="Edge Smoothness"
            value={edgeSmoothness}
            onChange={setEdgeSmoothness}
            min={0}
            max={1}
            step={0.1}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
