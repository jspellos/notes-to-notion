"use client";

import { createContext, useContext, ReactNode } from "react";

// Define a type for our mock user
interface MockUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  user: MockUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create a static mock user
const mockUser: MockUser = {
  uid: 'test-123',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: null
};

export function AuthProvider({ children }: { children: ReactNode }) {

  // Stub out the auth functions to do nothing
  const signInWithGoogle = async () => {
    console.log("signInWithGoogle called. No action taken in mock mode.");
  };

  const handleSignOut = async () => {
    console.log("signOut called. No action taken in mock mode.");
  };

  const value = {
    user: mockUser,
    loading: false, // The user is never in a loading state
    signInWithGoogle,
    signOut: handleSignOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
