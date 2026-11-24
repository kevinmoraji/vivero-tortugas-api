export default function LogoTortuga({ tamano = 40, className = "" }) {
  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="Tortuga marina"
    >
      {/* Aletas */}
      <ellipse cx="17" cy="22" rx="11" ry="5" transform="rotate(-35 17 22)" fill="var(--color-aleta)" />
      <ellipse cx="47" cy="22" rx="11" ry="5" transform="rotate(35 47 22)" fill="var(--color-aleta)" />
      <ellipse cx="20" cy="46" rx="7" ry="4" transform="rotate(35 20 46)" fill="var(--color-aleta)" />
      <ellipse cx="44" cy="46" rx="7" ry="4" transform="rotate(-35 44 46)" fill="var(--color-aleta)" />
      {/* Cola y cabeza */}
      <path d="M32 50 L29 58 L35 58 Z" fill="var(--color-aleta)" />
      <ellipse cx="32" cy="11" rx="6" ry="7" fill="var(--color-aleta)" />
      <circle cx="29.5" cy="9.5" r="1.2" fill="var(--color-oceano-profundo)" />
      <circle cx="34.5" cy="9.5" r="1.2" fill="var(--color-oceano-profundo)" />
      {/* Caparazón */}
      <ellipse cx="32" cy="33" rx="15" ry="18" fill="var(--color-caparazon)" stroke="var(--color-caparazon-borde)" strokeWidth="2" />
      <path
        d="M32 20 L38 25 L38 33 L32 38 L26 33 L26 25 Z"
        fill="none"
        stroke="var(--color-caparazon-borde)"
        strokeWidth="1.6"
      />
      <path
        d="M26 25 L19 22 M38 25 L45 22 M26 33 L18 36 M38 33 L46 36 M32 38 L32 50 M32 20 L32 16"
        stroke="var(--color-caparazon-borde)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}