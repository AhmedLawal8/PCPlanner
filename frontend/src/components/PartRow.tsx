import { Group, Paper, Stack, Text } from '@mantine/core'
import type { Part } from '../constants/parts'

interface PartRowProps {
  part: Part
}

export function PartRow({ part }: PartRowProps) {
  return (
    <Paper withBorder radius="md" p="md" bg="gray.1">
      <Group wrap="nowrap" gap="lg">
        <Text fw={700} w={100} ta="right" c="brandOrange">
          ${part.price.toLocaleString()}
        </Text>
        <Stack gap={2} flex={1}>
          <Text size="sm" c="dimmed" tt="uppercase">
            {part.category}
          </Text>
          <Text fw={600}>{part.name}</Text>
        </Stack>
      </Group>
    </Paper>
  )
}
