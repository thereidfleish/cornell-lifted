import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GlobalProvider } from "@/utils/GlobalContext";
import { ConditionalLayout } from "@/components/layout/ConditionalLayout";

export const metadata: Metadata = {
  title: "Cornell Lifted",
  description: "Web app for the Cornell Lifted event",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <GlobalProvider>
      <html lang="en">
        <body
          className="antialiased">
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </body>
      </html>
    </GlobalProvider>
  );
}
