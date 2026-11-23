import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { LanguageProvider } from "../context/LanguageContext";
import PwaManager from "../components/PwaManager";
import AppShell from "../components/AppShell";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#2E7D32",
  colorScheme: "light",
};

export const metadata = {
  title: "Krishi Drishti - An Integrated Decision Support System for Crop Health and Farmer Advisory",
  description:
    "Krishi Drishti - An Integrated Decision Support System for Crop Health and Farmer Advisory — AI-powered leaf disease detection, weather forecasts, spray advice, soil health, and profit tracking for Indian agriculture.",
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
      <body className="bg-[#F8FAFC] text-krishi-text antialiased font-sans min-h-screen">
        <LanguageProvider>
          <AuthProvider>
            <AppShell>{children}</AppShell>
            <PwaManager />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
