import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function ContextProvider({ children }) {
    const [authStatus, setAuthStatus] = useState(false);

    return (
        <AuthContext.Provider value={{ authStatus, setAuthStatus }}>
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