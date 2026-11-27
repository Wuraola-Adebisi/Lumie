import { describe, expect, it } from 'vitest'
import { mockAssistantProvider } from './mockAssistantProvider'

describe('mock assistant provider', () => {
  it('identifies itself as a mock and returns a writing starter', async () => {
    const response = await mockAssistantProvider.run({ task: 'writing.start', input: 'A note to an old friend' })
    expect(response.provider).toBe('mock')
    expect(response.model).toBe('lumie-sample-responses')
    expect(response.suggestions[0].content).toContain('Start with one thing')
  })

  it('returns a structured design direction', async () => {
    const response = await mockAssistantProvider.run({ task: 'design.direction', input: 'A bright postcard' })
    expect(response.task).toBe('design.direction')
    expect(response.suggestions[0].label).toBe('A visual direction')
    expect(response.suggestions[0].content).toContain('postcard')
  })

  it('does not invent a live provider or usage record', async () => {
    const response = await mockAssistantProvider.run({ task: 'writing.tone', input: 'A warm message' })
    expect(response.provider).not.toBe('bedrock')
    expect(response.provider).not.toBe('nvidia-nim')
    expect(response.usage).toBeUndefined()
  })
})
