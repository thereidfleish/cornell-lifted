import React from "react";
import { useGlobal } from "@/utils/GlobalContext";

const StringLights: React.FC = () => {
    const { isWinter } = useGlobal();

    return null

    if (!isWinter) return null;

    return (
        <div 
            className="absolute inset-0 pointer-events-none z-[5] rounded-xl"
            style={{
                border: '16px solid transparent',
                borderImage: "url('/images/string_lights.png') 40 round",
            }}
        />
    );
};

export default StringLights;
