export const MIN_ROTATION = -12;
export const MAX_ROTATION = 12;

export function getRandomRotation(currentRotation: number) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const nextRotation = MIN_ROTATION + Math.random() * (MAX_ROTATION - MIN_ROTATION);
    if (nextRotation !== currentRotation) return nextRotation;
  }

  return currentRotation <= MIN_ROTATION ? MAX_ROTATION : MIN_ROTATION;
}
