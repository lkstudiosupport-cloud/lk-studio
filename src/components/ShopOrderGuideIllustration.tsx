import type { ShopOrderGuideIcon } from "@/lib/shop-order-guide";

/** Mini 3D-style scene for each guide step — CSS perspective, no WebGL. */
export function ShopOrderGuideIllustration({ icon }: { icon: ShopOrderGuideIcon }) {
  return (
    <div className="shop-order-guide-stage mx-auto h-28 w-full max-w-[200px]" aria-hidden="true">
      <div className="shop-order-guide-cube">
        <div className="shop-order-guide-face shop-order-guide-face-front">
          <GuideScene icon={icon} />
        </div>
        <div className="shop-order-guide-face shop-order-guide-face-right">
          <GuideScene icon={icon} variant="side" />
        </div>
      </div>
    </div>
  );
}

function GuideScene({ icon, variant = "front" }: { icon: ShopOrderGuideIcon; variant?: "front" | "side" }) {
  const dim = variant === "side" ? 0.85 : 1;
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" style={{ opacity: dim }}>
      <defs>
        <linearGradient id="guidePhoneGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1b3022" />
          <stop offset="100%" stopColor="#2d4a38" />
        </linearGradient>
        <linearGradient id="guideGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f5d547" />
          <stop offset="100%" stopColor="#d4a017" />
        </linearGradient>
      </defs>
      <rect x="8" y="8" width="104" height="104" rx="16" fill="#faf8f5" stroke="#1b3022" strokeWidth="1.5" />
      {icon === "customer" && (
        <>
          <circle cx="60" cy="42" r="14" fill="#e8b4a0" stroke="#1b3022" strokeWidth="1.2" />
          <path d="M38 88 Q60 68 82 88" fill="#1b3022" opacity="0.15" />
          <rect x="32" y="92" width="56" height="8" rx="4" fill="url(#guideGoldGrad)" className="shop-order-guide-pulse-bar" />
        </>
      )}
      {icon === "phone" && (
        <>
          <rect x="44" y="28" width="32" height="56" rx="6" fill="url(#guidePhoneGrad)" />
          <rect x="48" y="36" width="24" height="36" rx="2" fill="#faf8f5" />
          <rect x="52" y="78" width="16" height="3" rx="1.5" fill="#f5d547" />
          <text x="60" y="58" textAnchor="middle" fill="#1b3022" fontSize="10" fontWeight="700">
            +91
          </text>
        </>
      )}
      {icon === "find" && (
        <>
          <circle cx="52" cy="52" r="18" fill="none" stroke="#1b3022" strokeWidth="3" />
          <line x1="64" y1="64" x2="82" y2="82" stroke="#1b3022" strokeWidth="4" strokeLinecap="round" />
          <circle cx="52" cy="52" r="8" fill="url(#guideGoldGrad)" className="shop-order-guide-pulse-dot" />
        </>
      )}
      {icon === "measurements" && (
        <>
          <path d="M60 24 L72 40 L60 56 L48 40 Z" fill="#ec4899" stroke="#1b3022" strokeWidth="1" />
          <line x1="36" y1="70" x2="84" y2="70" stroke="#1b3022" strokeWidth="1.5" markerEnd="url(#)" />
          <line x1="60" y1="58" x2="60" y2="92" stroke="#1b3022" strokeWidth="1.5" />
          <text x="60" y="88" textAnchor="middle" fill="#1b3022" fontSize="8" fontWeight="600">
            cm
          </text>
        </>
      )}
      {(icon === "person" || icon === "favorites") && (
        <>
          <rect x="28" y="32" width="28" height="36" rx="4" fill="#f0c9b8" stroke="#1b3022" strokeWidth="1" />
          <rect x="64" y="32" width="28" height="36" rx="4" fill="#f0c9b8" stroke="#1b3022" strokeWidth="1" />
          {icon === "favorites" && (
            <path
              d="M60 78 L54 72 Q48 66 54 60 Q60 54 66 60 Q72 66 66 72 Z"
              fill="url(#guideGoldGrad)"
              className="shop-order-guide-pulse-dot"
            />
          )}
        </>
      )}
      {icon === "upload" && (
        <>
          <rect x="38" y="48" width="44" height="32" rx="4" fill="#e5e7eb" stroke="#1b3022" strokeWidth="1" />
          <path d="M60 38 L60 58 M52 46 L60 38 L68 46" stroke="#1b3022" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="48" cy="58" r="4" fill="#14b8a6" />
        </>
      )}
      {icon === "notes" && (
        <>
          <rect x="34" y="30" width="52" height="60" rx="4" fill="#fff" stroke="#1b3022" strokeWidth="1.2" />
          <line x1="42" y1="46" x2="78" y2="46" stroke="#d4d4d8" strokeWidth="2" />
          <line x1="42" y1="56" x2="72" y2="56" stroke="#d4d4d8" strokeWidth="2" />
          <line x1="42" y1="66" x2="66" y2="66" stroke="#d4d4d8" strokeWidth="2" />
        </>
      )}
      {icon === "submit" && (
        <>
          <rect x="30" y="44" width="60" height="28" rx="14" fill="url(#guideGoldGrad)" stroke="#1b3022" strokeWidth="1.5" />
          <path d="M48 58 L56 66 L72 50" fill="none" stroke="#1b3022" strokeWidth="3" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
