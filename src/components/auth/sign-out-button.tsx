"use client";

import { useAuth } from "@/providers/supabase-auth-provider";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  const { user, signOut } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <Button onClick={signOut} variant="outline" size="sm">
      <LogOut className="h-4 w-4 mr-2" />
      Sign out
    </Button>
  );
}
