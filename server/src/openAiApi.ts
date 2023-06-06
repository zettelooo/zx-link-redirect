import { Configuration, OpenAIApi } from 'openai'
import { OPEN_AI_API_KEY } from './constants'

export const openAiApi = new OpenAIApi(new Configuration({ apiKey: OPEN_AI_API_KEY }))
