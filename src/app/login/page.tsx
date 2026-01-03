"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BrainCircuit } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/");
    }
  }, [user, loading, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <BrainCircuit className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Gemini to Notion</CardTitle>
          <CardDescription>Sign in to start recording your voice notes.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            className="w-full" 
            onClick={signInWithGoogle} 
            disabled={loading}
            variant="secondary"
          >
            {loading ? "Loading..." : "Sign in with Google"}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
