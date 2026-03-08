import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <h1 className="text-6xl font-bold text-dark-text">404</h1>
      <p className="mt-2 text-lg text-medium-text">This page could not be found.</p>
      <Button asChild className="mt-6">
        <Link href="/" className="inline-flex items-center gap-2">
          <Home className="h-4 w-4" />
          Back to Home
        </Link>
      </Button>
    </div>
  );
}
