import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { type PropsWithChildren } from 'react';
import { headers } from 'next/headers';
import { TRPCReactProvider } from '@/components/providers/trpc';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WhatsApp Scheduler",
  description: "Schedule your WhatsApp messages",
};

export default async function RootLayout({
  children,
}: PropsWithChildren) {
  const heads = await headers();
  
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <TRPCReactProvider headers={new Headers(heads)}>
          {children}
        </TRPCReactProvider>
      </body>
    </html>
  );
}
