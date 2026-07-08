import { Carousel } from '@mantine/carousel'
import { Stack, Title } from '@mantine/core'
import { GuideCard } from './GuideCard'
import type { Guide } from '../constants/guides'

interface GuideCarouselProps {
  title: string
  guides: Guide[]
}

export function GuideCarousel({ title, guides }: GuideCarouselProps) {
  return (
    <Stack gap="sm">
      <Title order={3}>{title}</Title>
      <Carousel
        slideSize={{ base: '70%', sm: '40%', md: '30%' }}
        slideGap="md"
        withControls
        emblaOptions={{ align: 'start', dragFree: true }}
      >
        {guides.map((guide) => (
          <Carousel.Slide key={guide.id}>
            <GuideCard guide={guide} />
          </Carousel.Slide>
        ))}
      </Carousel>
    </Stack>
  )
}
