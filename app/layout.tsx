import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title:"המומחה של דוד – בדיקת רכב לפני קנייה", description:"בדיקה חכמה וקפדנית לרכב יד שנייה" };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="he" dir="rtl"><body>{children}</body></html>; }
