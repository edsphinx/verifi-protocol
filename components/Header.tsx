import { PlusCircle } from "lucide-react"; // Or any icon you prefer
import Link from "next/link";
import { Button } from "./ui/button";
import { WalletSelector } from "./WalletSelector";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          {/* Replace with your Logo component */}
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold">VeriFi Protocol</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <Link href="/portfolio">
            <Button variant="ghost">My Portfolio</Button>
          </Link>
          <Link href="/create">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Create Market
            </Button>
          </Link>
          <WalletSelector />
        </div>
      </div>
    </header>
  );
}
