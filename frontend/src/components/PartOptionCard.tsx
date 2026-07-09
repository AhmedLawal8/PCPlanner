import { Card, Group, Stack, Text, UnstyledButton, useMantineTheme } from '@mantine/core'
import { IconStarFilled } from '@tabler/icons-react'
import type { PartOption } from '../constants/parts'

interface PartOptionCardProps {
  option: PartOption
  isRecommended: boolean
  isSelected: boolean
  onSelect: () => void
}

export function PartOptionCard({ option, isRecommended, isSelected, onSelect }: PartOptionCardProps) {
  const theme = useMantineTheme()

  return (
    <UnstyledButton onClick={onSelect} w="100%">
      <Card
        withBorder
        radius="md"
        p="xs"
        bg={isSelected ? 'brandOrange.0' : 'gray.1'}
        bd={isSelected ? '2px solid brandOrange.6' : '1px solid gray.3'}
      >
        <Stack gap={4}>
          <Text fw={700} size="sm" c="brandOrange">
            ${option.price.toLocaleString()}
          </Text>
          <Group gap={4} wrap="nowrap" align="flex-start">
            {isRecommended && <IconStarFilled size={14} color={theme.colors.brandOrange[6]} />}
            <Text size="xs" fw={isRecommended ? 700 : 400} lineClamp={2}>
              {option.name}
            </Text>
          </Group>
        </Stack>
      </Card>
    </UnstyledButton>
  )
}
