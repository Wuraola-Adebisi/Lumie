export type AssistantTask = 'writing.start' | 'writing.rewrite' | 'writing.tone' | 'writing.clarity' | 'writing.voice' | 'design.direction' | 'memory.search' | 'collection.organise'

export interface AssistantRequest {
  task: AssistantTask
  input: string
  context?: {
    documentId?: string
    selectedText?: string
    format?: string
    userSelectedSourceIds?: string[]
  }
  preferences?: {
    tone?: string
    length?: 'short' | 'medium' | 'long'
    preserveVoice?: boolean
  }
}

export interface AssistantSuggestion {
  id: string
  label: string
  content: string
  rationale?: string
  sourceRefs?: Array<{ resourceId: string; excerptId?: string }>
}

export interface AssistantResponse {
  requestId: string
  task: AssistantTask
  provider: 'mock' | 'bedrock' | 'nvidia-nim'
  model: string
  status: 'complete' | 'needs_review'
  suggestions: AssistantSuggestion[]
  usage?: {
    inputTokens?: number
    outputTokens?: number
    estimatedCostUsd?: number
  }
}

export interface AssistantProvider {
  readonly id: AssistantResponse['provider']
  run(request: AssistantRequest): Promise<AssistantResponse>
}
