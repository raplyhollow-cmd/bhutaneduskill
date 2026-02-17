import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";
import { ToastProvider } from "@/components/ui/toast";
import { UnifiedAIAssistant } from "@/components/ai/unified-ai-assistant";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bhutan EduSkill - Career Guidance & School Management",
  description: "Comprehensive career guidance and school management platform for Bhutan schools",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Skip ClerkProvider during build if env vars missing
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return (
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <ToastProvider>{children}</ToastProvider>
            <div className="fixed bottom-6 right-6 z-50">
              <UnifiedAIAssistant />
            </div>
          </ThemeProvider>
        </body>
      </html>
    );
  }

  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <ToastProvider>{children}</ToastProvider>
            <div className="fixed bottom-6 right-6 z-50">
              <UnifiedAIAssistant />
            </div>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
