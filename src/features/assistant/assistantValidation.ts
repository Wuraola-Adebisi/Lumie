import type { AssistantRequest, AssistantResponse, AssistantSuggestion, AssistantTask } from './assistantTypes'

const tasks: AssistantTask[] = ['writing.start', 'writing.rewrite', 'writing.tone', 'writing.clarity', 'writing.voice', 'design.direction', 'memory.search', 'collection.organise']
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const isText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0

function isSuggestion(value: unknown): value is AssistantSuggestion {
  if (!isRecord(value) || !isText(value.id) || !isText(value.label) || !isText(value.content)) return false
  if (value.rationale !== undefined && typeof value.rationale !== 'string') return false
  if (value.sourceRefs !== undefined && (!Array.isArray(value.sourceRefs) || !value.sourceRefs.every((ref) => isRecord(ref) && isText(ref.resourceId) && (ref.excerptId === undefined || typeof ref.excerptId === 'string')))) return false
  return true
}

export function validateAssistantRequest(request: AssistantRequest): void {
  if (!tasks.includes(request.task)) throw new Error('Unsupported assistant task.')
  if (typeof request.input !== 'string' || request.input.length > 5000) throw new Error('Assistant input must be a string of 5,000 characters or fewer.')
}

export function parseAssistantResponse(value: unknown, expectedTask: AssistantTask): AssistantResponse {
  if (!isRecord(value)) throw new Error('The assistant returned an invalid response.')
  if (!isText(value.requestId) || value.task !== expectedTask) throw new Error('The assistant response does not match the request.')
  if (!['mock', 'bedrock', 'nvidia-nim'].includes(String(value.provider))) throw new Error('The assistant provider is not supported.')
  if (!isText(value.model) || !['complete', 'needs_review'].includes(String(value.status))) throw new Error('The assistant response is missing required metadata.')
  if (!Array.isArray(value.suggestions) || value.suggestions.length < 1 || value.suggestions.length > 5 || !value.suggestions.every(isSuggestion)) throw new Error('The assistant returned suggestions in an unexpected format.')
  if (value.usage !== undefined) {
    if (!isRecord(value.usage)) throw new Error('Assistant usage metadata is invalid.')
    for (const key of ['inputTokens', 'outputTokens', 'estimatedCostUsd'] as const) {
      const metric = value.usage[key]
      if (metric !== undefined && (typeof metric !== 'number' || !Number.isFinite(metric) || metric < 0)) throw new Error('Assistant usage metadata contains an invalid value.')
    }
  }
  return value as unknown as AssistantResponse
}
