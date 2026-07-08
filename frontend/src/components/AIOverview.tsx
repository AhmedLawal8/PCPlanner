import { Paper, ScrollArea, Text, Title } from '@mantine/core'

interface AIOverviewProps {
  text: string
}

export function AIOverview({ text }: AIOverviewProps) {
  return (
    <Paper withBorder radius="md" p="md" bg="gray.1">
      <Title order={3} mb="sm">
        AI Overview
      </Title>
      <ScrollArea h={300} type="auto" offsetScrollbars>
        <Text>{text}</Text>
      </ScrollArea>
    </Paper>
  )
}
