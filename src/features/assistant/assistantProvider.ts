import type { AssistantProvider, AssistantRequest, AssistantResponse } from './assistantTypes'
import { mockAssistantProvider } from './mockAssistantProvider'

// Keep the active provider explicit. Live adapters are added only after provider
// access, privacy controls, budgets and evaluation are approved.
const activeProvider: AssistantProvider = mockAssistantProvider

export function requestAssistant(request: AssistantRequest): Promise<AssistantResponse> {
  return activeProvider.run(request)
}
