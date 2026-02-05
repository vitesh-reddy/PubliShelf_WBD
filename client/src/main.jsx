import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './store'
import { FirstVisitProvider } from './context/FirstVisitContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
  <Provider store={store}>
    <BrowserRouter>
    <FirstVisitProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </FirstVisitProvider>
    </BrowserRouter>
  </Provider>
  </StrictMode>,
)
