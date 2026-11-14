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
};

export default function RootLayout({ children }) {
  return (
    <html lang="hi">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="bg-gray-100 text-krishi-text antialiased font-sans">
        <LanguageProvider>
          <AuthProvider>
            <div className="max-w-[480px] min-h-screen mx-auto bg-white shadow-xl flex flex-col relative pb-20">
              <main className="flex-1">{children}</main>
              <BottomNav />
            </div>
            <PwaManager />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
