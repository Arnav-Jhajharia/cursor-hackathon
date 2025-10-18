import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import Providers from "../components/Providers";
import "./globals.css";

const buttonStyles = `
  .layout-button button {
    background: transparent;
    border: none;
    color: inherit;
    font-size: inherit;
    font-weight: inherit;
    cursor: pointer;
    padding: 0;
    width: 100%;
    height: 100%;
  }
`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "habituate - Turn Bad Habits into Good Ones",
  description: "Track habits, build streaks, and compete with friends in monthly challenges",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <style dangerouslySetInnerHTML={{ __html: buttonStyles }} />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          suppressHydrationWarning
        >
          <SignedIn>
            <header className="border-b border-gray-200 bg-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                  <div className="flex items-center">
                    <h1 className="text-xl font-bold text-gray-900">habituate</h1>
                  </div>
                  <div className="flex items-center space-x-4">
                    <UserButton />
                  </div>
                </div>
              </div>
            </header>
          </SignedIn>
          <main className="min-h-screen bg-gray-50">
            <Providers>{children}</Providers>
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}
