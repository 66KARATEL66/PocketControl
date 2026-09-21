import { createContext, useContext, useEffect, useState } from "react";
import {
    clearStoredSession,
    loadStoredSession,
    saveSession,
    scanBarcode,
} from "./auth";
import { fetchCommands } from "./commands";

const AuthContext = createContext(null);

export function ContextProvider({ children }) {
    const [session, setSession] = useState(null);
    const [commands, setCommands] = useState([]);
    const [status, setStatus] = useState("loading");
    const [error, setError] = useState(null);

    const clearSession = async () => {
        await clearStoredSession();
        setSession(null);
        setCommands([]);
        setError(null);
        setStatus("unauthenticated");
    };

    const refreshCommands = async (activeSession = session) => {
        if (!activeSession) {
            setCommands([]);
            return [];
        }

        try {
            const nextCommands = await fetchCommands(activeSession);
            setCommands(nextCommands);
            setError(null);
            return nextCommands;
        } catch (requestError) {
            if (requestError.code === "auth_required") {
                await clearSession();
            }
            throw requestError;
        }
    };

    const establishSession = async (nextSession) => {
        // Replace the command cache atomically so reconnects cannot display
        // commands from the previous server while the new list is loading.
        setStatus("loading");
        setSession(nextSession);
        setCommands([]);
        await refreshCommands(nextSession);
        await saveSession(nextSession);
        setError(null);
        setStatus("authenticated");
    };

    useEffect(() => {
        let active = true;

        const restore = async () => {
            try {
                const storedSession = await loadStoredSession();
                if (!storedSession) {
                    if (active) setStatus("unauthenticated");
                    return;
                }

                await establishSession(storedSession);
            } catch (restoreError) {
                await clearStoredSession();
                if (active) {
                    setSession(null);
                    setCommands([]);
                    setError(restoreError);
                    setStatus("unauthenticated");
                }
            }
        };

        restore();
        return () => {
            active = false;
        };
    }, []);

    const connect = async () => {
        setStatus("loading");
        setError(null);
        setCommands([]);

        try {
            const nextSession = await scanBarcode();
            await establishSession(nextSession);
        } catch (connectError) {
            await clearStoredSession();
            setSession(null);
            setCommands([]);
            setError(connectError);
            setStatus("unauthenticated");
            throw connectError;
        }
    };

    return (
        <AuthContext.Provider
            value={{
                session,
                commands,
                status,
                error,
                authStatus: status === "authenticated",
                connect,
                refreshCommands,
                logout: clearSession,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used inside a ContextProvider");
    }
    return context;
}
