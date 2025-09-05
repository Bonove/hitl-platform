import Link from "next/link";
import { UserProfile } from "@/components/auth/user-profile";
import { ModeToggle } from "./ui/mode-toggle";
import { HeadphonesIcon } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold">
          <Link
            href="/"
            className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <HeadphonesIcon className="h-5 w-5" />
            </div>
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              HITL Platform
            </span>
          </Link>
        </h1>
        <div className="flex items-center gap-4">
          <UserProfile />
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
