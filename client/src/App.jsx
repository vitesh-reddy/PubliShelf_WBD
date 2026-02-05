import './App.css'
import { Routes } from 'react-router-dom'
import { useSelector } from 'react-redux'
import PublicRoutes from './routes/PublicRoutes'
import ProtectedRoutes from './routes/ProtectedRoutes'
import PublicOnlyRoutes from './routes/PublicOnlyRoutes'
import ToastProvider from './components/ToastProvider'
import EntryAnimation from './components/EntryAnimation.jsx'
import BackendReadyCheck from './components/BackendReadyCheck.jsx'
import ThemeToggle from './components/ThemeToggle.jsx'

const App = () => {
  const isBackendReady = useSelector((state) => state.backend.isReady);

  return (
    <div>
      <BackendReadyCheck />
      {isBackendReady && (
        <>
          <EntryAnimation />
          <ToastProvider />
          <ThemeToggle />
          <Routes>
            {/* Can be accessed by any users */}
            {PublicRoutes()}
            
            {/* Can be accessed by non-authenticated users only */}
            {PublicOnlyRoutes()}
            
            {/* Can be accessed by authenticated users only */}
            {ProtectedRoutes()}
          </Routes>
        </>
      )}
    </div>
  )
}

export default App
