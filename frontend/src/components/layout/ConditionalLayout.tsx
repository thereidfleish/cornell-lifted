"use client";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import NavBar from "@/components/layout/NavBar";
import Footer from "@/components/layout/Footer";

interface ConditionalLayoutProps {
  children: ReactNode;
}

export const ConditionalLayout = ({ children }: ConditionalLayoutProps) => {
  const pathname = usePathname();
  
  // Hide nav and footer on the circle page
  const hideNavAndFooter = pathname === "/circle";
  
  return (
    <>
      {!hideNavAndFooter && <NavBar />}
      <main>{children}</main>
      {!hideNavAndFooter && <Footer />}
    </>
  );
};
