import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import 'leaflet/dist/leaflet.css';
import { ThemeProvider } from "@/components/ThemeProvider";
import PWAInstallPrompt, { IOSInstallInstructions } from "@/components/PWAInstallPrompt";


export const metadata: Metadata = {
  title: "NaviLoop - Smart Bus Tracker",
  description: "Real-time smart bus tracking system with AI-powered features",
  keywords: ["bus", "tracker", "navigation", "AI", "real-time", "transport"],
  authors: [{ name: "NaviLoop Team" }],
  creator: "NaviLoop Team",
  metadataBase: new URL('https://navi-loop-n02m4d0ch-sai-ganesh-rejetis-projects.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "NaviLoop - Smart Bus Tracker",
    description: "Real-time smart bus tracking system with AI-powered features",
    url: 'https://navi-loop-n02m4d0ch-sai-ganesh-rejetis-projects.vercel.app',
    siteName: 'NaviLoop',
    locale: 'en_US',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  appleWebApp: {
    title: 'NaviLoop',
    statusBarStyle: 'default',
    capable: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="NaviLoop" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192x192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster />
            <PWAInstallPrompt />
            <IOSInstallInstructions />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
