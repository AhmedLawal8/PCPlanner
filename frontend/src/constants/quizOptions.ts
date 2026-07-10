export interface QuizAnswers {
  useCase: string | null
  budget: number
  priority: string | null
}

export const USE_CASE_OPTIONS = [
  { value: 'gaming', label: 'Gaming' },
  { value: 'video-editing', label: 'Creativity/Production' },
  { value: 'general-use', label: 'General Use' },
  { value: 'streaming', label: 'Streaming' },
]

export const PRIORITY_OPTIONS = [
  { value: 'performance', label: 'Raw Performance' },
  { value: 'value', label: 'Best Value' },
  { value: 'quiet', label: 'Quiet & Efficient' },
  { value: 'aesthetics', label: 'Aesthetics (RGB / looks)' },
]

// The quiz's useCase values don't match the backend's budget-split preset
// names, so requests to /api/builds/generate need to go through this map.
export const USE_CASE_TO_BACKEND: Record<string, string> = {
  gaming: 'gaming',
  'video-editing': 'production',
  'general-use': 'general',
  streaming: 'streaming',
}
