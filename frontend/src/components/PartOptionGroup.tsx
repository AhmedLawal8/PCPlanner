import { SimpleGrid, Stack, Text } from '@mantine/core'
import { PartOptionCard } from './PartOptionCard'
import type { PartCategoryGroup } from '../constants/parts'

interface PartOptionGroupProps {
  group: PartCategoryGroup
  selectedIndex: number
  onSelect: (index: number) => void
}

export function PartOptionGroup({ group, selectedIndex, onSelect }: PartOptionGroupProps) {
  return (
    <Stack gap="xs">
      <Text size="sm" c="dimmed" tt="uppercase">
        {group.category}
      </Text>
      <SimpleGrid cols={{ base: 2, sm: 3, md: 5 }} spacing="sm">
        {group.options.map((option, index) => (
          <PartOptionCard
            key={option.name}
            option={option}
            isRecommended={index === group.recommendedIndex}
            isSelected={index === selectedIndex}
            onSelect={() => onSelect(index)}
          />
        ))}
      </SimpleGrid>
    </Stack>
  )
}
