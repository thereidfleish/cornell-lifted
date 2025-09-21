"use client";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import NavBar from "@/components/layout/NavBar";
import Footer from "@/components/layout/Footer";

interface LayoutWrapperProps {
  children: ReactNode;
}

export const LayoutWrapper = ({ children }: LayoutWrapperProps) => {
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
