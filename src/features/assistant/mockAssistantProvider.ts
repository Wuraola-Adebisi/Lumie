import type { AssistantProvider, AssistantRequest, AssistantResponse } from './assistantTypes'

const examples: Partial<Record<AssistantRequest['task'], { label: string; content: string; rationale: string }>> = {
  'writing.start': {
    label: 'A place to begin',
    content: 'Start with one thing you remember clearly. What happened, what did it mean to you, and what do you want the other person to know? You do not need the perfect opening yet. Try: “I keep thinking about the time we…”',
    rationale: 'A simple prompt to help the writer find their own opening.',
  },
  'writing.tone': {
    label: 'A tone to try',
    content: 'Keep the message direct, then soften the edges with one specific detail. Say what you mean in your own words; you do not need to make every sentence sound polished.',
    rationale: 'A gentle direction that keeps the writer in control of the wording.',
  },
  'design.direction': {
    label: 'A visual direction',
    content: 'Try a postcard with a warm paper base, one strong photograph, a short handwritten heading and a small stamp in the corner. Let the image do some of the talking and leave breathing room around the message.',
    rationale: 'An editable visual direction rather than a flattened generated image.',
  },
}

export const mockAssistantProvider: AssistantProvider = {
  id: 'mock',
  async run(request): Promise<AssistantResponse> {
    const example = examples[request.task] ?? examples['writing.start']!
    return {
      requestId: `mock-${request.task}`,
      task: request.task,
      provider: 'mock',
      model: 'lumie-sample-responses',
      status: 'complete',
      suggestions: [{ id: `sample-${request.task}`, ...example }],
    }
  },
}
