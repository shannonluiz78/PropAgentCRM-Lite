// PropAgent CRM Lite mark: a simple geometric roofline, standing in for
// "property." Single-color path via currentColor so it drops into either
// the navy-on-brass or brass-on-navy badge treatments already in use.
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M12 2.5L21 10.5V21.5H3V10.5L12 2.5Z" fill="currentColor" />
    </svg>
  );
}
