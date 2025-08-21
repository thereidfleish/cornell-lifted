"use client"
import React, { createContext, useContext, useEffect, useState } from "react";
import { User, LiftedConfig } from "@/types/User";

type GlobalState = {
    user: User;
    config: LiftedConfig;
    loading: boolean;
    refresh: () => Promise<void>;
};

const GlobalContext = createContext<GlobalState | undefined>(undefined);

export const GlobalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User>(null);
    const [config, setConfig] = useState<LiftedConfig>(null);
    const [loading, setLoading] = useState(true);

    const fetchGlobalData = async () => {
        try {
            const [statusRes, configRes] = await Promise.all([
                fetch("/api/auth/status", { credentials: "include" }).then(r => r.json()),
                fetch("/api/config").then(r => r.json()),
            ]);
            setUser(statusRes);
            setConfig(configRes);
        } catch (err) {
            console.error("Failed to load global data", err);
        } finally {
            setLoading(false);
        }
    };

    const refresh = async () => {
        setLoading(true);
        await fetchGlobalData();
    };

    useEffect(() => {
        fetchGlobalData();
    }, []);

    return (
        <GlobalContext.Provider value={{ user, config, loading, refresh }}>
            {children}
        </GlobalContext.Provider>
    );
};

export const useGlobal = () => {
    const ctx = useContext(GlobalContext);
    if (!ctx) throw new Error("useGlobal must be used within GlobalProvider");
    return ctx;
};
