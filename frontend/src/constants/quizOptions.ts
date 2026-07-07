export interface QuizAnswers {
  useCase: string | null
  budget: number
  priority: string | null
}

export const USE_CASE_OPTIONS = [
  { value: 'gaming', label: 'Gaming' },
  { value: 'video-editing', label: 'Video Editing' },
  { value: 'general-use', label: 'General Use' },
  { value: 'streaming', label: 'Streaming' },
]

export const PRIORITY_OPTIONS = [
  { value: 'performance', label: 'Raw Performance' },
  { value: 'value', label: 'Best Value' },
  { value: 'quiet', label: 'Quiet & Efficient' },
  { value: 'aesthetics', label: 'Aesthetics (RGB / looks)' },
]
