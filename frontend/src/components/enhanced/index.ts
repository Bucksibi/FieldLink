// Enhanced FieldLink Components
// Industrial Precision Design System for HVAC Professionals

export { default as AppEnhanced } from './AppEnhanced'
export { default as LoginPageEnhanced } from './LoginPageEnhanced'
export { theme, cssVariables } from './theme'

/**
 * HOW TO USE THE ENHANCED VERSION
 * ================================
 *
 * To switch to the enhanced design, update your main.tsx:
 *
 * Option 1: Replace the entire App
 * ---------------------------------
 * Change:
 *   import App from './App'
 * To:
 *   import App from './components/enhanced/AppEnhanced'
 *
 * Option 2: Keep both and toggle with env variable
 * -------------------------------------------------
 * import App from './App'
 * import AppEnhanced from './components/enhanced/AppEnhanced'
 * const UseEnhanced = import.meta.env.VITE_ENHANCED_UI === 'true'
 * const AppComponent = UseEnhanced ? AppEnhanced : App
 *
 * Then set VITE_ENHANCED_UI=true in your .env
 *
 * TO REVERT: Simply change the import back to './App'
 */
