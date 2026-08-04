type LogoProps = { className?: string; compact?: boolean }

export function Logo({ className = '', compact = false }: LogoProps) {
  const source = `${import.meta.env.BASE_URL}ED%20Emmanuelle%20Doppia%20Logo%20Blanc.png`
  return (
    <span className={`brand ${compact ? 'brand--compact' : ''} ${className}`}>
      <img src={source} alt="" aria-hidden="true" />
      <span className="sr-only">Emmanuelle Doppia Photographie</span>
    </span>
  )
}
