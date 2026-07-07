import { Container, Title } from '@mantine/core'
import { QuizPage } from './components/QuizPage'

function App() {
  return (
    <Container size="sm" py="xl">
      <Title order={2} mb="lg">
        PC Build Quiz
      </Title>
      <QuizPage />
    </Container>
  )
}

export default App
