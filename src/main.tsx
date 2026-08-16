import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/cormorant-garamond/latin-400.css'
import '@fontsource/cormorant-garamond/latin-400-italic.css'
import '@fontsource/cormorant-garamond/latin-500.css'
import '@fontsource/manrope/latin-400.css'
import '@fontsource/manrope/latin-500.css'
import './styles.css'
import App from './App'
import { LanguageProvider } from './i18n'
import { InterfaceControlsProvider } from './interfaceControls'
import { CartProvider } from './cart'
import { AuthProvider } from './auth'
import { SalesProvider } from './sales'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <AuthProvider>
        <SalesProvider>
          <CartProvider>
            <InterfaceControlsProvider>
              <App />
            </InterfaceControlsProvider>
          </CartProvider>
        </SalesProvider>
      </AuthProvider>
    </LanguageProvider>
  </StrictMode>,
)
