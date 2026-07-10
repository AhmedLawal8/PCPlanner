import { SimpleGrid, Stack, Text } from '@mantine/core'
import { PartOptionCard } from './PartOptionCard'
import type { PartCategoryGroup, PartOption } from '../constants/parts'

const CATEGORY_LABELS: Record<string, string> = {
  cpu: 'CPU',
  gpu: 'GPU',
  motherboard: 'Motherboard',
  ram: 'RAM',
  storage: 'Storage',
  psu: 'PSU',
  case: 'Case',
  cooler: 'Cooler',
}

interface PartOptionGroupProps {
  group: PartCategoryGroup
  selectedId: number | undefined
  onSelect: (option: PartOption) => void
}

export function PartOptionGroup({ group, selectedId, onSelect }: PartOptionGroupProps) {
  return (
    <Stack gap="xs">
      <Text size="sm" c="dimmed" tt="uppercase" fw={600}>
        {CATEGORY_LABELS[group.category] ?? group.category}
      </Text>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="sm">
        {group.options.map((option) => (
          <PartOptionCard
            key={option.id}
            option={option}
            isSelected={option.id === selectedId}
            onSelect={() => onSelect(option)}
          />
        ))}
      </SimpleGrid>
    </Stack>
  )
}
