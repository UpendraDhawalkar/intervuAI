import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider"; // 👈 Add this

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "IntervuAI",
  description: "AI-powered interview system",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      {/* 👇 Required for preventing hydration mismatch */}
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {/* 🎨 Theme provider added here */}
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Toaster position="bottom-center"/>  {/* Notifications */}
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
