import { Routes, Route } from 'react-router-dom'
import { QuizPage } from './components/QuizPage'
import { SummaryPage } from './components/SummaryPage'
import { GuidesPage } from './components/GuidesPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<QuizPage />} />
      <Route path="/summary" element={<SummaryPage />} />
      <Route path="/guides" element={<GuidesPage />} />
    </Routes>
  )
}

export default App
