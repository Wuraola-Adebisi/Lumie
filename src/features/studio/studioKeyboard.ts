export function getStudioKeyboardMovement(key: string, shiftKey = false): [number, number] | null {
  const step = shiftKey ? 5 : 1
  const movements: Record<string, [number, number]> = {
    ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step],
  }
  return movements[key] ?? null
}

export function clampStudioPosition(value: number): number {
  return Math.max(0, Math.min(92, value))
}
