const getCubicBezierPoint = (
  t: number,
  x0: number,
  y0: number,
  cpx1: number,
  cpy1: number,
  cpx2: number,
  cpy2: number,
  x1: number,
  y1: number,
) => {
  const x =
    Math.pow(1 - t, 3) * x0 +
    3 * Math.pow(1 - t, 2) * t * cpx1 +
    3 * (1 - t) * Math.pow(t, 2) * cpx2 +
    Math.pow(t, 3) * x1;

  const y =
    Math.pow(1 - t, 3) * y0 +
    3 * Math.pow(1 - t, 2) * t * cpy1 +
    3 * (1 - t) * Math.pow(t, 2) * cpy2 +
    Math.pow(t, 3) * y1;

  return { x: x, y: y };
};

export const generateAllPoints = (
  x0: number,
  y0: number,
  cpx1: number,
  cpy1: number,
  cpx2: number,
  cpy2: number,
  x1: number,
  y1: number,
  pointsCount: number,
) => {
  const points = [];
  const pc2 = pointsCount;
  points.push(getCubicBezierPoint(0, x0, y0, cpx1, cpy1, cpx2, cpy2, x1, y1));

  for (let i = 1; i < pc2 - 1; i++) {
    const t = i / pc2;
    points.push(getCubicBezierPoint(t, x0, y0, cpx1, cpy1, cpx2, cpy2, x1, y1));
  }

  points.push(getCubicBezierPoint(1, x0, y0, cpx1, cpy1, cpx2, cpy2, x1, y1));

  return points;
  // return findEvenlySpacedPoints(points, pointsCount);
};

const computeDistance = (
  p1: { x: number; y: number },
  p2: { x: number; y: number },
) => {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

const calculateCurveLength = (points: { x: number; y: number }[]) => {
  let length = 0;
  let previousPoint = points[0];

  for (let i = 1; i < points.length; i++) {
    const currentPoint = points[i];
    length += computeDistance(previousPoint, currentPoint);
    previousPoint = currentPoint;
  }

  return length;
};

export const findEvenlySpacedPoints = (
  allPoints: { x: number; y: number }[],
  numPoints: number,
) => {
  const totalLength = calculateCurveLength(allPoints);
  const segmentLength = totalLength / numPoints;
  const evenSpaced: { x: number; y: number }[] = [];
  let accumulatedLength = 0;
  let previousPoint = allPoints[0];

  evenSpaced.push(previousPoint);

  for (let i = 1; i <= allPoints.length - 1; i++) {
    const currentPoint = allPoints[i];
    const distance = computeDistance(previousPoint, currentPoint);

    if (accumulatedLength + distance >= segmentLength) {
      const currentPointLength = accumulatedLength + distance;
      if (
        currentPointLength - segmentLength <
        segmentLength - accumulatedLength
      ) {
        evenSpaced.push(currentPoint);
      } else {
        evenSpaced.push(previousPoint);
      }

      accumulatedLength = 0;
    } else {
      accumulatedLength += distance;
    }

    previousPoint = currentPoint;
  }

  return evenSpaced;
};
