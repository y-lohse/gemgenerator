import { SVG } from "@svgdotjs/svg.js";
import "@svgdotjs/svg.filter.js";
import BezierEasing from "bezier-easing";
import { useEffect, useRef, useState } from "react";
import { SliderSetting } from "./components/sliderSetting";
import { ToggleSetting } from "./components/toggleSetting";
import {
  createVector,
  evenlySpacedEllipsePoints,
  getAngle,
  getCentroid,
  getNormal,
  getVectorLength,
  normalizedAngleDifference,
} from "./ellipse";

function App() {
  const drawAreaRef = useRef<HTMLDivElement | null>(null);

  const [sides, setSides] = useState(6);
  const [widthFactor, setWidthFactor] = useState(0.6);
  const [heightFactor, setHeightFactor] = useState(0.9);
  const [levelsCount, setLevelsCount] = useState(2);
  const [outsideSpread, setOutsideSpread] = useState(0.5);
  const [centerSpread, setCenterSpread] = useState(1);
  const [isPointy, setIsPointy] = useState(false);
  const [useAlternateAngle, setUseAlternateAngle] = useState(false);
  const [lightSourcePosition, setLightSourcePosition] = useState(3);
  const [hue, setHue] = useState(0);
  const [luminosity, setLuminosity] = useState(40);
  const [contrast, setContrast] = useState(30);

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

    const outline = levels[0];
    const lightVector = createVector(4, -lightSourceAngle);
    // draw
    //   .polygon(
    //     outline
    //       .map((p) => `${renderOffsetX + p[0]},${renderOffsetY + p[1]}`)
    //       .join(" "),
    //   )
    //   .opacity(0.5)
    //   .filterWith((add) => {
    //     add.dropShadow(add.$sourceAlpha, lightVector[0], lightVector[1], 4);
    //   });

    faces.forEach((polyPoints, faceIndex) => {
      const centroid = getCentroid(polyPoints);
      const centroidAngle = getAngle(centroid[0], centroid[1]);
      const elevation =
        (maxDistance - getVectorLength(centroid[0], centroid[1])) / maxDistance;

      const isTopSurface = faceIndex === faces.length - 1 && !isPointy;

      const normal = getNormal(centroid[0], centroid[1]);
      const normalAngle = getAngle(normal[0], normal[1]);
      const gradientAngle = isTopSurface
        ? lightSourceAngle + Math.PI / 2
        : normalAngle;

      const minLuminosity = Math.max(luminosity - contrast, 0);

      const dimmingEffect =
        normalizedAngleDifference(lightSourceAngle, centroidAngle) *
        (1 - elevation);
      const luminosityVariance = luminosity - minLuminosity;
      const light = luminosity - luminosityVariance * dimmingEffect;

      const gradient = draw
        .gradient("linear", function (add) {
          add.stop(0, `hsl(${hue}, 80%, ${light - 10}%)`);
          add.stop(0.2, `hsl(${hue}, 80%, ${light}%)`);
          add.stop(0.5, `hsl(${hue}, 80%, ${light + 10}%)`);
          add.stop(0.8, `hsl(${hue}, 80%, ${light}%)`);
          add.stop(1, `hsl(${hue}, 80%, ${light - 10}%)`);
        })
        .rotate((gradientAngle * 180) / Math.PI, 0.5, 0.5);

      draw
        .polygon(
          polyPoints
            .map((p) => `${renderOffsetX + p[0]},${renderOffsetY + p[1]}`)
            .join(" "),
        )
        .fill(gradient);
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
    hue,
    luminosity,
    contrast,
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
            label="Hue"
            value={hue}
            onChange={setHue}
            min={0}
            max={360}
          />
          <SliderSetting
            label="Luminosity"
            value={luminosity}
            onChange={setLuminosity}
            min={30}
            max={50}
          />
          <SliderSetting
            label="Contrast"
            value={contrast}
            onChange={setContrast}
            min={0}
            max={50}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
