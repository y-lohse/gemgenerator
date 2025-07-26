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
