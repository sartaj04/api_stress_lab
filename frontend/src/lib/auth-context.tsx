'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { auth, User } from '@/lib/api';

// Google OAuth config - loaded from environment
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string) => Promise<void>;
    loginWithGoogle: () => void;
    handleGoogleCallback: (code: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = Cookies.get('token');
        if (token) {
            auth.me()
                .then(setUser)
                .catch(() => {
                    Cookies.remove('token');
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email: string, password: string) => {
        const { access_token } = await auth.login(email, password);
        Cookies.set('token', access_token, { expires: 7 });
        const userData = await auth.me();
        setUser(userData);
    };

    const signup = async (email: string, password: string) => {
        const { access_token } = await auth.signup(email, password);
        Cookies.set('token', access_token, { expires: 7 });
        const userData = await auth.me();
        setUser(userData);
    };

    const loginWithGoogle = () => {
        const redirectUri = `${window.location.origin}/auth/google/callback`;
        const scope = 'email profile openid';
        const responseType = 'code';
        
        const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
        authUrl.searchParams.set('redirect_uri', redirectUri);
        authUrl.searchParams.set('response_type', responseType);
        authUrl.searchParams.set('scope', scope);
        authUrl.searchParams.set('access_type', 'offline');
        authUrl.searchParams.set('prompt', 'consent');
        
        window.location.href = authUrl.toString();
    };

    const handleGoogleCallback = async (code: string) => {
        const redirectUri = `${window.location.origin}/auth/google/callback`;
        const { access_token } = await auth.googleAuth(code, redirectUri);
        Cookies.set('token', access_token, { expires: 7 });
        const userData = await auth.me();
        setUser(userData);
    };

    const logout = () => {
        Cookies.remove('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, loginWithGoogle, handleGoogleCallback, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
