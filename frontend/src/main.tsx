import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

// ============================================
// SWITCH BETWEEN ORIGINAL AND ENHANCED UI
// ============================================
// To use ORIGINAL design: uncomment line below, comment out enhanced import
// import App from './App.tsx'

// To use ENHANCED design (Industrial Precision):
import App from './components/enhanced/AppEnhanced'

// ============================================

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
