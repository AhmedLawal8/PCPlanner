import { Badge, Group } from '@mantine/core'
import { USE_CASE_OPTIONS, PRIORITY_OPTIONS } from '../constants/quizOptions'
import type { QuizAnswers } from '../constants/quizOptions'

interface PreferenceChipsProps {
  answers: QuizAnswers
}

export function PreferenceChips({ answers }: PreferenceChipsProps) {
  const useCaseLabel = USE_CASE_OPTIONS.find((option) => option.value === answers.useCase)?.label
  const priorityLabel = PRIORITY_OPTIONS.find((option) => option.value === answers.priority)?.label

  return (
    <Group gap="sm">
      {useCaseLabel && (
        <Badge color="brandOrange" size="lg">
          {useCaseLabel}
        </Badge>
      )}
      <Badge color="brandOrange" size="lg">
        ${answers.budget.toLocaleString()} budget
      </Badge>
      {priorityLabel && (
        <Badge color="brandOrange" size="lg">
          {priorityLabel}
        </Badge>
      )}
    </Group>
  )
}
