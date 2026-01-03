import { BrainCircuit } from "lucide-react";
import { UserButton } from "@/components/auth/user-button";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex items-center">
          <BrainCircuit className="h-6 w-6 mr-2 text-primary" />
          <span className="font-bold">Notes to Notion</span>
        </div>
        <div className="flex flex-1 items-center justify-end">
          <nav className="flex items-center">
            <UserButton />
          </nav>
        </div>
      </div>
    </header>
  );
}
