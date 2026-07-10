import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { HomePage } from './components/HomePage'
import { QuizPage } from './components/QuizPage'
import { SummaryPage } from './components/SummaryPage'
import { GuidesPage } from './components/GuidesPage'
import { BuildsPage } from './components/BuildsPage'
import { BuildDetailPage } from './components/BuildDetailPage'
import { SignInPage } from './components/SignInPage'
import { SignUpPage } from './components/SignUpPage'
import { ProtectedRoute } from './components/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/guides" element={<GuidesPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/summary" element={<SummaryPage />} />
          <Route path="/builds" element={<BuildsPage />} />
          <Route path="/builds/:id" element={<BuildDetailPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
