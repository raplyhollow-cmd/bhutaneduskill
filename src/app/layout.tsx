import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { ToastProvider } from "@/components/ui/toaster";
import { NotificationProvider } from "@/components/unified/Notifications";
import { UnifiedAIAssistant } from "@/components/ai/unified-ai-assistant";
import { UserProvider } from "@/hooks/use-current-user";
import { AppErrorBoundary } from "@/components/error/app-error-boundary";
import { TransitionProvider } from "@/components/transitions/transition-provider";
import { GlobalProviders } from "@/components/global/global-providers";
import { QueryProvider } from "@/components/providers/query-provider";
import { ClerkProvider } from "@/components/providers/clerk-provider-wrapper";
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
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
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
      <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
    <NotificationProvider>
          <AppErrorBoundary>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
              <UserProvider>
                <QueryProvider>
                  <TransitionProvider>
                    <ToastProvider>
                      {children}
                    </ToastProvider>
                  </TransitionProvider>
                  {/* Render UnifiedAIAssistant directly - it's already a client component */}
                  <UnifiedAIAssistant />
                  {/* Global UI Providers */}
                  <GlobalProviders />
                </QueryProvider>
              </UserProvider>
            </ThemeProvider>
          </AppErrorBoundary></NotificationProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
