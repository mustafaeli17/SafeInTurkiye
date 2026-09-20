import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import VisitorAnalytics from './components/VisitorAnalytics'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <VisitorAnalytics />
  </React.StrictMode>,
)
