import { describe, expect, it } from 'vitest'
import { clampStudioPosition, getStudioKeyboardMovement } from './studioKeyboard'

describe('studio keyboard movement', () => {
  it.each([['ArrowLeft', [-1, 0]], ['ArrowRight', [1, 0]], ['ArrowUp', [0, -1]], ['ArrowDown', [0, 1]]] as const)('maps %s to a one-step movement', (key, expected) => {
    expect(getStudioKeyboardMovement(key)).toEqual(expected)
  })
  it.each([['ArrowLeft', [-5, 0]], ['ArrowRight', [5, 0]], ['ArrowUp', [0, -5]], ['ArrowDown', [0, 5]]] as const)('maps shifted %s to a five-step movement', (key, expected) => {
    expect(getStudioKeyboardMovement(key, true)).toEqual(expected)
  })
  it('returns null for unrelated keys', () => {
    expect(getStudioKeyboardMovement('Enter')).toBeNull()
    expect(getStudioKeyboardMovement('Tab')).toBeNull()
  })
})

describe('clampStudioPosition', () => {
  it.each([[-10, 0], [0, 0], [45, 45], [92, 92], [120, 92]])('clamps %s to %s', (value, expected) => {
    expect(clampStudioPosition(value)).toBe(expected)
  })
})
