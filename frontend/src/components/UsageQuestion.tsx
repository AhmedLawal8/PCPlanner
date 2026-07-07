import { Radio, Stack } from '@mantine/core'
import { USE_CASE_OPTIONS } from '../constants/quizOptions'

interface UsageQuestionProps {
  value: string | null
  onChange: (value: string) => void
}

export function UsageQuestion({ value, onChange }: UsageQuestionProps) {
  return (
    <Radio.Group
      label="What will you use it for?"
      value={value}
      onChange={onChange}
    >
      <Stack mt="=sm">
        {USE_CASE_OPTIONS.map((option) => (
          <Radio key={option.value} value={option.value} label={option.label} />
        ))}
      </Stack>
    </Radio.Group>
  )
}
