import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export function ContextProvider({ children }) {
    const [authStatus, setAuthStatus] = useState(false);

    return (
        <AuthContext.Provider value={{authStatus, setAuthStatus}}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth()
{
    return useContext(AuthContext);
}