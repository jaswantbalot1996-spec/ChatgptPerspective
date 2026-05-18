import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { initEngine } from './store/explorationStore'

// Wire the Zustand store adapter into the engine before any render
initEngine()

createRoot(document.getElementById('root')!).render(
  <App />
)
