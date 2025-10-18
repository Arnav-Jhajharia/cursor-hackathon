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
import Navigation from "../components/Navigation";
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
                     <Navigation />
                   </SignedIn>
                   <main className="min-h-screen pb-20">
                     <Providers>{children}</Providers>
                   </main>
        </body>
      </html>
    </ClerkProvider>
  );
}
