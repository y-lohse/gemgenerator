function ellipseArcLength(
  a: number,
  b: number,
  t: number,
  steps = 100,
): number {
  let length = 0;
  let prev = 0;
  for (let i = 1; i <= steps; i++) {
    const theta = (t * i) / steps;
    const dtheta = theta - prev;
    const dx = -a * Math.sin(theta);
    const dy = b * Math.cos(theta);
    length += Math.sqrt(dx * dx + dy * dy) * dtheta;
    prev = theta;
  }
  return length;
}

function findTForArcLength(
  a: number,
  b: number,
  targetS: number,
  tMax = 2 * Math.PI,
): number {
  let low = 0,
    high = tMax;
  while (high - low > 1e-6) {
    const mid = (low + high) / 2;
    const s = ellipseArcLength(a, b, mid);
    if (s < targetS) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

export function evenlySpacedEllipsePoints(
  a: number,
  b: number,
  N: number,
  angleOffset: number = Math.PI / 2,
): Array<[number, number]> {
  const totalLength = ellipseArcLength(a, b, 2 * Math.PI);
  const arcLengths = Array.from({ length: N }, (_, i) => (i * totalLength) / N);
  return arcLengths.map((s) => {
    const t = findTForArcLength(a, b, s) + angleOffset;
    return [a * Math.cos(t), b * Math.sin(t)];
  });
}

export function getCentroid(points: Array<[number, number]>): [number, number] {
  const n = points.length;
  if (n === 0) return [0, 0];
  const sumX = points.reduce((acc, [x]) => acc + x, 0);
  const sumY = points.reduce((acc, [, y]) => acc + y, 0);
  return [sumX / n, sumY / n];
}

export function getAngle(x: number, y: number): number {
  return Math.atan2(-y, -x);
}

export function createVector(
  distance: number,
  angle: number,
): [number, number] {
  return [distance * Math.cos(angle), -distance * Math.sin(angle)];
}

export function normalizedAngleDifference(
  angle1: number,
  angle2: number,
): number {
  const diff = Math.abs(angle1 - angle2) % (2 * Math.PI);
  const minDiff = diff > Math.PI ? 2 * Math.PI - diff : diff;
  return minDiff / Math.PI;
}

export function angleDifference(a: number, b: number): number {
  const diff = Math.abs(a - b) % (2 * Math.PI);
  const normalized = diff > Math.PI ? 2 * Math.PI - diff : diff;
  if (normalized === 0) return 0;
  if (normalized === Math.PI / 2) return 1;
  if (normalized === Math.PI) return 0;
  return Math.abs(Math.cos(normalized));
}

export function getVectorLength(x: number, y: number): number {
  return Math.sqrt(x * x + y * y);
}

export function normalizeVector(x: number, y: number): [number, number] {
  const length = getVectorLength(x, y);
  return length === 0 ? [0, 0] : [x / length, y / length];
}

export function getNormal(x: number, y: number): [number, number] {
  const length = getVectorLength(x, y);
  return length === 0 ? [0, 0] : [-y / length, x / length];
}
