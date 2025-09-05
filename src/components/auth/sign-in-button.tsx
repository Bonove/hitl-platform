"use client";

import { useAuth } from "@/providers/supabase-auth-provider";
import { Button } from "@/components/ui/button";

export function SignInButton() {
  const { user, loading, signInWithGoogle } = useAuth();

  if (loading) {
    return <Button disabled>Loading...</Button>;
  }

  if (user) {
    return null;
  }

  return (
    <Button onClick={signInWithGoogle}>
      Sign in
    </Button>
  );
}