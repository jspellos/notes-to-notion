"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithRedirect, 
  getRedirectResult,
  signOut, 
  User 
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // Handle the redirect result
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          // This is the signed-in user
          const user = result.user;
          setUser(user);
          router.push("/");
        }
      })
      .catch((error) => {
        console.error("Error getting redirect result: ", error);
        toast({
          variant: "destructive",
          title: "Sign-in Error",
          description: error.message,
        });
      })
      .finally(() => {
        setLoading(false);
      });

    return () => unsubscribe();
  }, [router, toast]);

  const signInWithGoogle = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(auth, provider);
    // After this, the page will redirect to Google's sign-in page.
    // The result is handled by the useEffect hook when the user is redirected back.
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // onAuthStateChanged will set user to null
      router.push("/login");
    } catch (error) {
      console.error("Error signing out: ", error);
       toast({
        variant: "destructive",
        title: "Sign-out Error",
        description: "Could not sign out. Please try again.",
      });
    }
  };

  const value = {
    user,
    loading,
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
