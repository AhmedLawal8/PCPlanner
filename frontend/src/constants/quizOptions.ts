export interface QuizAnswers {
  useCase: string | null
  budget: number
}

export const USE_CASE_OPTIONS = [
  { value: 'gaming', label: 'Gaming' },
  { value: 'streaming', label: 'Streaming' },
  { value: 'production', label: 'Workstation / Production' },
  { value: 'general', label: 'Office / General Use' },
]
