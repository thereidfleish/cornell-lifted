"use client"
import React, { createContext, useContext, useEffect, useState } from "react";
import { User, LiftedConfig } from "@/types/User";
import { isWinterTheme } from "@/utils/winterTheme";
import posthog from "posthog-js";

type GlobalState = {
    user: User;
    config: LiftedConfig;
    loading: boolean;
    isWinter: boolean;
    refreshConfig: () => Promise<void>;
};

const GlobalContext = createContext<GlobalState | undefined>(undefined);

export const GlobalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User>(null);
    const [config, setConfig] = useState<LiftedConfig>(null);
    const [loading, setLoading] = useState(true);
    const [isWinter, setIsWinter] = useState(false);

    const fetchGlobalData = async () => {
        try {
            const [statusRes, configRes] = await Promise.all([
                fetch("/api/auth/status", { credentials: "include" }).then(r => r.json()),
                fetch("/api/config").then(r => r.json()),
            ]);
            setUser(statusRes);
            setConfig(configRes);

            console.log("Fetched global data:", { statusRes, configRes });
            
            // Set PostHog person properties when user is authenticated
            if (statusRes?.authenticated && statusRes.user) {
                posthog.identify(statusRes.user.id, {
                    email: statusRes.user.id,
                    name: statusRes.user.name,
                    is_admin: statusRes.user.is_admin,
                });
            } else if (!statusRes?.authenticated) {
                // Reset PostHog when user logs out
                posthog.reset();
            }
            
            // Determine if winter theme should be active
            setIsWinter(isWinterTheme(configRes.form_message_group));
        } catch (err) {
            console.error("Failed to load global data", err);
        } finally {
            setLoading(false);
        }
    };

    const refreshConfig = async () => {
        console.log("Refreshing global config");
        setLoading(true);
        await fetchGlobalData();
    };

    useEffect(() => {
        fetchGlobalData();
    }, []);

    return (
        <GlobalContext.Provider value={{ user, config, loading, isWinter, refreshConfig }}>
            {children}
        </GlobalContext.Provider>
    );
};

export const useGlobal = () => {
    const ctx = useContext(GlobalContext);
    if (!ctx) throw new Error("useGlobal must be used within GlobalProvider");
    return ctx;
};
