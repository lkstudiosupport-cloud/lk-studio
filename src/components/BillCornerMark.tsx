import Image from "next/image";
import { BILL_CORNER_LOGO } from "@/lib/bill-branding";

export function BillCornerMark({
  position,
  appName,
}: {
  position: "tl" | "tr" | "bl" | "br";
  appName: string;
}) {
  return (
    <div className={`bill-receipt-corner bill-receipt-corner--${position}`}>
      <div className="bill-receipt-corner-mark">
        <Image
          src={BILL_CORNER_LOGO}
          alt=""
          width={24}
          height={24}
          className="bill-receipt-corner-logo"
          unoptimized
        />
      </div>
      <p className="bill-receipt-corner-name">{appName}</p>
    </div>
  );
}
