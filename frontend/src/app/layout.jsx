import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { LanguageProvider } from "../context/LanguageContext";
import BottomNav from "../components/BottomNav";
import PwaManager from "../components/PwaManager";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#2E7D32",
  colorScheme: "light",
};

export const metadata = {
  title: "Krishi Drishti - AI Crop Advisory for Indian Farmers",
  description:
    "AI-powered leaf disease detection, weather forecasts, spray advice, soil health, and profit tracking for Indian agriculture.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
  other: {
    "color-scheme": "light only",
    "supported-color-schemes": "light",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="hi" className="light" style={{ colorScheme: "light" }}>
      <head>
        <meta name="color-scheme" content="light only" />
        <meta name="supported-color-schemes" content="light" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="bg-slate-100 text-krishi-text antialiased font-sans min-h-screen">
        <LanguageProvider>
          <AuthProvider>
            <div className="min-h-screen flex flex-col items-center justify-start bg-slate-100 sm:py-6">
              <div className="w-full max-w-[480px] min-h-screen sm:min-h-[840px] bg-white shadow-2xl flex flex-col relative pb-20 sm:rounded-2xl sm:border sm:border-slate-200">
                <main className="flex-1">{children}</main>
                <BottomNav />
              </div>
            </div>
            <PwaManager />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
