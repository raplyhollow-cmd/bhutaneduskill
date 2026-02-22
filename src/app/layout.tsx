import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";
import { ToastProvider } from "@/components/ui/toast";
import { UnifiedAIAssistant } from "@/components/ai/unified-ai-assistant";
import { UserProvider } from "@/hooks/use-current-user";
import { AppErrorBoundary } from "@/components/error/app-error-boundary";
import { TransitionProvider } from "@/components/transitions/transition-provider";
import { GlobalProviders } from "@/components/global/global-providers";
import "./globals.css";
import "../styles/ceramic.css";

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
  // ClerkProvider always wraps, but the component handles missing auth gracefully
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <AppErrorBoundary>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
              <UserProvider>
                <TransitionProvider>
                  <ToastProvider>
                    {children}
                  </ToastProvider>
                  <UnifiedAIAssistant />
                </TransitionProvider>
                {/* Global UI Providers */}
                <GlobalProviders />
              </UserProvider>
            </ThemeProvider>
          </AppErrorBoundary>
        </body>
      </html>
    </ClerkProvider>
  );
}
