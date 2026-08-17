import type { useLanguage } from './i18n'

type AccountTranslations = ReturnType<typeof useLanguage>['t']['account']

// Shared by AccountPanel and CartPanel's in-tunnel sign-in/sign-up step so both surfaces map
// Supabase's English error strings to the same localized messages.
export function mapAuthError(message: string | null, t: AccountTranslations): string {
  if (!message) return t.errorGeneric
  const normalized = message.toLowerCase()
  if (normalized.includes('invalid login credentials')) return t.errorInvalidCredentials
  if (normalized.includes('already registered') || normalized.includes('already exists')) return t.errorEmailInUse
  if (normalized.includes('at least 6 characters')) return t.errorPasswordTooShort
  return t.errorGeneric
}
