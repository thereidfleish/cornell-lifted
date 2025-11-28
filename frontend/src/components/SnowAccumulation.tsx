"use client"
import { useGlobal } from "@/utils/GlobalContext";

export default function SnowAccumulation() {
    const { isWinter } = useGlobal();

    if (!isWinter) return null;

    return (
        <div 
            className="absolute top-0 left-0 right-0 h-4 md:h-6 pointer-events-none z-10"
            style={{
                backgroundImage: 'url(/images/snow_accumulation.png)',
                backgroundRepeat: 'repeat-x',
                backgroundPosition: 'bottom center',
                backgroundSize: 'auto 100%',
                transform: 'scaleY(-1) translateY(50%)'
            }}
        />
    );
}
