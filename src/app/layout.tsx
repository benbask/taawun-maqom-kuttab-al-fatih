import type { Metadata } from "next";
import { Amiri, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { NavigationLoading } from "@/components/site/navigation-loading";
import { safePublicStats, safeSettings } from "@/lib/safe";
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

const FALLBACK_TITLE = "Ta'awun Maqom Kuttab Al Fatih Lampung";
const FALLBACK_DESCRIPTION =
  "Bersama berTa'awun untuk pendidikan Qur'an di Maqom Kuttab Al Fatih Lampung. Transparan, terverifikasi, dan mudah.";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await safeSettings();
  const stats = await safePublicStats(settings.target_amount).catch(() => null);

  const siteName = settings.site_name?.trim() || FALLBACK_TITLE;
  const shareTitle = settings.share_title?.trim() || siteName;
  const description =
    settings.share_description?.trim() ||
    settings.tagline?.trim() ||
    FALLBACK_DESCRIPTION;
  const shareImage =
    settings.share_image_url?.trim() ||
    `/api/share-card?v=${stats?.total ?? 0}`;

  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    ),
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description,
    keywords: [
      "Ta'awun",
      "Maqom Kuttab Al Fatih Lampung",
      "Kuttab",
      "pendidikan Qur'an",
      "Lampung",
    ],
    openGraph: {
      title: shareTitle,
      description,
      siteName,
      type: "website",
      locale: "id_ID",
      ...(shareImage ? { images: [{ url: shareImage, alt: shareTitle }] } : {}),
    },
    twitter: {
      card: shareImage ? "summary_large_image" : "summary",
      title: shareTitle,
      description,
      ...(shareImage ? { images: [shareImage] } : {}),
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${jakarta.variable} ${amiri.variable}`}>
      <body className="min-h-screen bg-[#f8f5ee] text-stone-900">
        {children}
        <NavigationLoading />
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
