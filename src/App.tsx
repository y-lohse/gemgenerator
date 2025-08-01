import "@svgdotjs/svg.filter.js";
import { SVG } from "@svgdotjs/svg.js";
import Alea from "alea";
import BezierEasing from "bezier-easing";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SliderSetting } from "./components/sliderSetting";
import { ToggleSetting } from "./components/toggleSetting";
import {
  createVector,
  evenlySpacedEllipsePoints,
  getAngle,
  getCentroid,
  getVectorLength,
  normalizedAngleDifference,
} from "./ellipse";

const useGemSettings = (seed: string, minScaleFactor: number) => {
  const prng = useMemo(() => Alea(seed), [seed]);

  const randomBetween = useCallback(
    (min: number, max: number, floating: boolean = false): number => {
      const randomValue = prng();
      return floating
        ? min + randomValue * (max - min)
        : Math.floor(min + randomValue * (max - min));
    },
    [prng],
  );

  return useMemo(() => {
    const widthFactor = randomBetween(minScaleFactor, 1, true);
    const heightFactor = randomBetween(
      Math.max(minScaleFactor, widthFactor - 0.3),
      Math.min(1, widthFactor + 0.3),
      true,
    );

    return {
      sides: randomBetween(3, 12),
      widthFactor: widthFactor,
      heightFactor: heightFactor,
      levelsCount: randomBetween(2, 5),
      outsideSpread: randomBetween(0.1, 1, true),
      centerSpread: randomBetween(0.1, 1, true),
      useAlternateAngle: randomBetween(0, 1, true) > 0.5,
      lightSourcePosition: randomBetween(0, 7),
      reflections: Array.from({ length: 12 * 5 * 5 }, () =>
        randomBetween(0, 1, true),
      ),
      hue: randomBetween(0, 360),
      luminosity: randomBetween(30, 50),
      contrast: randomBetween(10, 50),
    };
  }, [minScaleFactor, randomBetween]);
};

function App() {
  const drawAreaRef = useRef<HTMLDivElement | null>(null);

  const minScaleFactor = 0.4;

  const gem = useGemSettings("new Date().getTime().toString()", minScaleFactor);

  const [sides, setSides] = useState(gem.sides);
  const [widthFactor, setWidthFactor] = useState(gem.widthFactor);
  const [heightFactor, setHeightFactor] = useState(gem.heightFactor);
  const [levelsCount, setLevelsCount] = useState(gem.levelsCount);
  const [outsideSpread, setOutsideSpread] = useState(gem.outsideSpread);
  const [centerSpread, setCenterSpread] = useState(gem.centerSpread);
  const [useAlternateAngle, setUseAlternateAngle] = useState(
    gem.useAlternateAngle,
  );
  const [lightSourcePosition, setLightSourcePosition] = useState(
    gem.lightSourcePosition,
  );
  const [reflections] = useState(gem.reflections);
  const [hue, setHue] = useState(gem.hue);
  const [luminosity, setLuminosity] = useState(gem.luminosity);
  const [contrast, setContrast] = useState(gem.contrast);

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
        // single face
        faces.push([
          levels[i][j],
          levels[i + 1][j],
          levels[i + 1][(j + 1) % sides],
          levels[i][(j + 1) % sides],
        ]);
      }
    }

    const topFace = levels[levels.length - 1];

    // unified top face
    faces.push(topFace);

    const lightSourceAngle = lightSourcePosition * (Math.PI / 4);
    const maxDistance = Math.max(maxWidth, maxHeight);

    const outline = levels[0];
    const shadowSize = 32;
    for (let i = 1; i < shadowSize; i *= 2) {
      const lightVector = createVector(i, -lightSourceAngle);
      draw
        .polygon(
          outline
            .map((p) => `${renderOffsetX + p[0]},${renderOffsetY + p[1]}`)
            .join(" "),
        )
        .filterWith((add) => {
          add.dropShadow(add.$source, lightVector[0], lightVector[1], i).attr({
            "flood-color": `hsl(${hue}, 30%, 40%)`,
            "flood-opacity": 0.8 / (i / 3),
          });
        });
    }

    faces.forEach((polyPoints, faceIndex) => {
      const centroid = getCentroid(polyPoints);
      const centroidAngle = getAngle(centroid[0], centroid[1]);
      const elevation =
        (maxDistance - getVectorLength(centroid[0], centroid[1])) / maxDistance;

      const isTopSurface = faceIndex === faces.length - 1;

      const gradientAngle = isTopSurface
        ? lightSourceAngle + Math.PI / 2
        : centroidAngle + Math.PI / 2;

      const minLuminosity = Math.max(luminosity - contrast, 0);

      const dimmingEffect =
        normalizedAngleDifference(lightSourceAngle, centroidAngle) *
        (1 - elevation);

      const luminosityVariance = luminosity - minLuminosity;
      const light = luminosity - luminosityVariance * dimmingEffect;

      const reflectionPoints = isTopSurface
        ? [0.2, 0.4, 0.5, 0.7, 0.8]
        : [0.2, 0.5, 0.7];

      const gradient = draw
        .gradient("linear", (add) => {
          add.stop(0, `hsl(${hue}, 80%, ${light}%)`);

          reflectionPoints.forEach((step, stepIndex) => {
            const stepVariance =
              -10 +
              reflections[faceIndex * reflectionPoints.length + stepIndex] * 20;
            add.stop(step, `hsl(${hue}, 80%, ${light + stepVariance}%)`);
          });

          add.stop(1, `hsl(${hue}, 80%, ${light}%)`);
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
    centerSpread,
    contrast,
    heightFactor,
    hue,
    levelsCount,
    lightSourcePosition,
    luminosity,
    maxLevels,
    outsideSpread,
    reflections,
    sides,
    useAlternateAngle,
    widthFactor,
  ]);

  const complement = (hue + 20) % 361;

  return (
    <div className="h-screen max-h-screen flex flex-col lg:flex-row justify-center items-stretch overflow-hidden">
      <div
        className="flex-1  bg-stone-200 flex justify-center items-center"
        style={{
          backgroundColor: `hsl(${complement}, 40%, 90%)`,
        }}
      >
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
