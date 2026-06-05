/** Side-profile sewing machine — gold line art like the brand reference. */
export function SewingMachineIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <circle cx="74" cy="17" r="11.5" stroke="currentColor" strokeWidth="2.4" />
      <path
        d="M36 24h34v18H36V24Z"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path
        d="M36 30H16V21H7"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M7 21v15" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M3.5 36h7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M3 44h88" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path
        d="M52 24V17"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
