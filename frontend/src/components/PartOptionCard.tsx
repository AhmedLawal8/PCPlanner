import { Badge, Card, Stack, Text, UnstyledButton } from '@mantine/core'
import type { PartOption, PartTier } from '../constants/parts'

const TIER_LABELS: Record<PartTier, string> = {
  budget: 'Budget',
  best_value: 'Best Value',
  recommend: 'Recommend',
  performance: 'Performance',
}

const TIER_COLORS: Record<PartTier, string> = {
  budget: 'gray',
  best_value: 'blue',
  recommend: 'brandOrange',
  performance: 'violet',
}

interface PartOptionCardProps {
  option: PartOption
  isSelected: boolean
  onSelect: () => void
}

export function PartOptionCard({ option, isSelected, onSelect }: PartOptionCardProps) {
  return (
    <UnstyledButton onClick={onSelect} w="100%">
      <Card
        withBorder
        radius="md"
        p="xs"
        bg={isSelected ? 'brandOrange.0' : 'gray.1'}
        bd={isSelected ? '2px solid brandOrange.6' : '1px solid gray.3'}
        h="100%"
      >
        <Stack gap={6}>
          <Badge size="xs" color={TIER_COLORS[option.tier]} variant="light">
            {TIER_LABELS[option.tier]}
          </Badge>
          <Text fw={700} size="sm" c="brandOrange">
            ${option.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
          <Text size="xs" fw={isSelected ? 700 : 400} lineClamp={2}>
            {option.name}
          </Text>
          {option.why && (
            <Text size="xs" c="dimmed" lh={1.4} lineClamp={3}>
              {option.why}
            </Text>
          )}
        </Stack>
      </Card>
    </UnstyledButton>
  )
}
