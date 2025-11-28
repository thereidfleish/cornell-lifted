"use client";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import NavBar from "@/components/layout/NavBar";
import Footer from "@/components/layout/Footer";
import Snowfall from 'react-snowfall'
import { useGlobal } from "@/utils/GlobalContext";

interface ConditionalLayoutProps {
  children: ReactNode;
}

export const ConditionalLayout = ({ children }: ConditionalLayoutProps) => {
  const pathname = usePathname();
  const { isWinter } = useGlobal();
  const [snowflakeCount, setSnowflakeCount] = useState(400);

  useEffect(() => {
    const updateSnowflakeCount = () => {
      if (window.innerWidth < 768) {
        setSnowflakeCount(100); // Mobile: fewer snowflakes
      } else {
        setSnowflakeCount(400); // Desktop: full amount
      }
    };

    updateSnowflakeCount();
    window.addEventListener('resize', updateSnowflakeCount);
    return () => window.removeEventListener('resize', updateSnowflakeCount);
  }, []);

  // Hide nav and footer on the circle page
  const hideNavAndFooter = pathname === "/circle";

  return (
    <>
      {!hideNavAndFooter && <NavBar />}
      {isWinter && (
        <Snowfall
          // Controls the number of snowflakes that are created (default 150)
          color="white"
          snowflakeCount={snowflakeCount}
          radius={[2, 4]}
          style={{
            position: 'fixed',
            width: '100vw',
            height: '100vh',
          }}
        />
      )}
      <main>{children}</main>
      {!hideNavAndFooter && <Footer />}
    </>
  );
};
