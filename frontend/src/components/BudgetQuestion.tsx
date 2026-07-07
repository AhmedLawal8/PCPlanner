import { Slider, Text } from '@mantine/core'
import { MARKS } from '../constants/budgetMarks'

interface BudgetQuestionProps {
  value: number
  onChange: (value: number) => void
}

export function BudgetQuestion({ value, onChange }: BudgetQuestionProps) {
  return (
    <div>
      <Text fw={500} mb="xs">
        What is your budget?
      </Text>
      <Text size="xl" fw={800} mb="md">
        ${value.toLocaleString()}
      </Text>
      <Slider
        min={100}
        max={5000}
        step={50}
        value={value}
        onChange={onChange}
        label={(value) => `$${value.toLocaleString()}`}
        marks={MARKS}
        mb="xl"
      />
    </div>
  )
}
