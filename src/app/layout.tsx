import type { Metadata } from "next";
import { Frank_Ruhl_Libre, Heebo } from "next/font/google";
import "./globals.css";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "600"],
});

const frankRuhl = Frank_Ruhl_Libre({
  variable: "--font-frank",
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "MAVASH Events",
  description:
    "פלטפורמה לאירועים — בר מצווה, חתונה, יום הולדת, כנסים ועוד. הזמנות QR, RSVP, ברכות וספר זיכרונות.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} ${frankRuhl.variable} h-full`}>
      <body className="min-h-full font-body antialiased">{children}</body>
    </html>
  );
}
