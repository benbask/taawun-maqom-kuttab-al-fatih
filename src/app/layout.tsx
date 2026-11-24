import type { Metadata } from "next";
import { Amiri, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const amiri = Amiri({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "Ta'awun Maqom Kuttab Al Fatih Lampung",
    template: "%s | Ta'awun Maqom Kuttab Al Fatih Lampung",
  },
  description:
    "Bersama berTa'awun untuk pendidikan Qur'an di Maqom Kuttab Al Fatih Lampung. Transparan, terverifikasi, dan mudah.",
  keywords: [
    "Ta'awun",
    "Maqom Kuttab Al Fatih Lampung",
    "Kuttab",
    "pendidikan Qur'an",
    "Lampung",
  ],
  openGraph: {
    title: "Ta'awun Maqom Kuttab Al Fatih Lampung",
    description:
      "Bersama berTa'awun untuk pendidikan Qur'an di Maqom Kuttab Al Fatih Lampung.",
    type: "website",
    locale: "id_ID",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${jakarta.variable} ${amiri.variable}`}>
      <body className="min-h-screen bg-[#f8f5ee] text-stone-900">
        {children}
        <Toaster
          position="top-center"
          richColors
          closeButton
          toastOptions={{ className: "font-sans" }}
        />
      </body>
    </html>
  );
}
