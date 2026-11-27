import type { AssistantProvider, AssistantRequest, AssistantResponse } from './assistantTypes'
import { mockAssistantProvider } from './mockAssistantProvider'
import { parseAssistantResponse, validateAssistantRequest } from './assistantValidation'

// Keep the active provider explicit. Live adapters are added only after provider
// access, privacy controls, budgets and evaluation are approved.
const activeProvider: AssistantProvider = mockAssistantProvider

export async function requestAssistant(request: AssistantRequest): Promise<AssistantResponse> {
  validateAssistantRequest(request)
  const response = await activeProvider.run(request)
  return parseAssistantResponse(response, request.task)
}
