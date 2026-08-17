// Thin-stroke outline icons matching the cursor/flag SVG convention used elsewhere
// (viewBox 0 0 24 24, stroke="currentColor", no fill) — sized in em so they scale with the
// surrounding text.

export function EnvelopeIcon() {
  return (
    <svg className="contact__icon" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2.5" y="5" width="19" height="14" rx="1.6" />
      <path d="M3.4 6.4 12 13.2l8.6-6.8" />
    </svg>
  )
}

export function InstagramIcon() {
  return (
    <svg className="contact__icon" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.1" cy="6.9" r="0.55" fill="currentColor" stroke="none" />
    </svg>
  )
}
