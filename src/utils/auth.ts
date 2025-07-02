import { USE_BEDROCK, USE_VERTEX } from './model.js'
import { getGlobalConfig } from './config.js'

export function isAnthropicAuthEnabled(): boolean {
  return false
  // return !(USE_BEDROCK || USE_VERTEX)
}

export function isLoggedInToAnthropic(): boolean {
  return false
  // const config = getGlobalConfig()
  // return !!config.primaryApiKey
}
