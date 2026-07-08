import { Routes, Route } from 'react-router-dom'
import { QuizPage } from './components/QuizPage'
import { SummaryPage } from './components/SummaryPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<QuizPage />} />
      <Route path="/summary" element={<SummaryPage />} />
    </Routes>
  )
}

export default App
