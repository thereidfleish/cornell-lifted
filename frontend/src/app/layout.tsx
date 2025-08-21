import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/layout/NavBar";
import Footer from "@/components/layout/Footer";
import { GlobalProvider } from "@/utils/GlobalContext";

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
          <NavBar />
          <main>{children}</main>
          <Footer />
        </body>
      </html>
    </GlobalProvider>
  );
}
