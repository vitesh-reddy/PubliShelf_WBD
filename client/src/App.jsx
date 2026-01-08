import './App.css'
import { Routes } from 'react-router-dom'
import PublicRoutes from './routes/PublicRoutes'
import ProtectedRoutes from './routes/ProtectedRoutes'
import PublicOnlyRoutes from './routes/PublicOnlyRoutes'
import ToastProvider from './components/ToastProvider'

const App = () => {
  return (
    <div>
      <ToastProvider />
      <Routes>
        {/* Can be accessed by any users */}
        {PublicRoutes()}
        
        {/* Can be accessed by non-authenticated users only */}
        {PublicOnlyRoutes()}
        
        {/* Can be accessed by authenticated users only */}
        {ProtectedRoutes()}
      </Routes>     
    </div>
  )
}

export default App
