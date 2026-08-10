import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";

const rubik = Rubik({
  subsets: ["hebrew", "latin"],
  variable: "--font-rubik",
  display: "swap",
});

export const metadata: Metadata = {
  title: "המומחה של דוד – בדיקת רכב לפני קנייה",
  description: "בדיקה חכמה וקפדנית לרכב יד שנייה",
};

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="he" dir="rtl"><body className={rubik.variable}>{children}</body></html>;
}
