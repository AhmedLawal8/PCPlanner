import { Radio, Stack } from '@mantine/core'
import { PRIORITY_OPTIONS } from '../constants/quizOptions'

interface PriorityQuestionProps {
  value: string | null
  onChange: (value: string) => void
}

export function PriorityQuestion({ value, onChange }: PriorityQuestionProps) {
  return (
    <Radio.Group
      label="What matters most to you?"
      value={value}
      onChange={onChange}
    >
      <Stack mt="xs">
        {PRIORITY_OPTIONS.map((option) => (
          <Radio key={option.value} value={option.value} label={option.label} />
        ))}
      </Stack>
    </Radio.Group>
  )
}
