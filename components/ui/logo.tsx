// PropAgent CRM Lite mark: a house outline with a small connected-node
// cluster inside, standing in for "an AI network working inside your
// property business." Fixed two-tone colors (not currentColor) since the
// mark carries its own navy/teal identity — always place it on a light
// backdrop, not directly on the navy sidebar background.
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 22"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 2L21 9V20H3V9L12 2Z"
        fill="none"
        stroke="#12161f"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <rect x="16" y="3.5" width="2" height="4.2" fill="#12161f" />
      <g stroke="#0d9488" strokeWidth="0.6" fill="none">
        <line x1="9" y1="13" x2="12" y2="10.8" />
        <line x1="12" y1="10.8" x2="15" y2="13" />
        <line x1="9" y1="13" x2="10.2" y2="16" />
        <line x1="12" y1="10.8" x2="10.2" y2="16" />
        <line x1="12" y1="10.8" x2="13.8" y2="16" />
        <line x1="15" y1="13" x2="13.8" y2="16" />
      </g>
      <g fill="#0d9488">
        <circle cx="9" cy="13" r="1" />
        <circle cx="12" cy="10.8" r="1.1" />
        <circle cx="15" cy="13" r="1" />
        <circle cx="10.2" cy="16" r="0.9" />
        <circle cx="13.8" cy="16" r="0.9" />
      </g>
    </svg>
  );
}
