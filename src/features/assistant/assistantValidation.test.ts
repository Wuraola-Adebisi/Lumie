import { describe, expect, it } from 'vitest'
import { mockAssistantProvider } from './mockAssistantProvider'
import { parseAssistantResponse, validateAssistantRequest } from './assistantValidation'
import type { AssistantTask } from './assistantTypes'

describe('assistant validation', () => {
  const task: AssistantTask = 'writing.start'
  it('accepts a valid mock response', async () => {
    const response = await mockAssistantProvider.run({ task, input: 'A note to a friend' })
    expect(parseAssistantResponse(response, task)).toEqual(response)
  })
  it('rejects a response for a different task', () => {
    const response = { requestId: 'req', task: 'writing.tone', provider: 'mock', model: 'test', status: 'complete', suggestions: [{ id: '1', label: 'Title', content: 'Draft' }] }
    expect(() => parseAssistantResponse(response, task)).toThrow(/does not match/)
  })
  it('rejects malformed suggestions', () => {
    const response = { requestId: 'req', task, provider: 'mock', model: 'test', status: 'complete', suggestions: [{ id: '', label: 'Title', content: 'Draft' }] }
    expect(() => parseAssistantResponse(response, task)).toThrow(/unexpected format/)
  })
  it('rejects negative usage values', () => {
    const response = { requestId: 'req', task, provider: 'mock', model: 'test', status: 'complete', suggestions: [{ id: '1', label: 'Title', content: 'Draft' }], usage: { inputTokens: -1 } }
    expect(() => parseAssistantResponse(response, task)).toThrow(/invalid value/)
  })
  it('rejects unsupported tasks and oversized input', () => {
    expect(() => validateAssistantRequest({ task: 'unknown' as AssistantTask, input: '' })).toThrow(/Unsupported/)
    expect(() => validateAssistantRequest({ task, input: 'x'.repeat(5001) })).toThrow(/5,000/)
  })
})

describe('mock assistant provider', () => {
  it.each(['writing.start', 'writing.tone', 'design.direction'] as AssistantTask[])('returns a valid suggestion for %s', async (task) => {
    const response = await mockAssistantProvider.run({ task, input: 'A postcard' })
    expect(response.task).toBe(task)
    expect(response.provider).toBe('mock')
    expect(response.suggestions).toHaveLength(1)
    expect(response.suggestions[0].content.length).toBeGreaterThan(0)
  })
})
