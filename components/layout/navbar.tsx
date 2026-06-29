"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold tracking-tight text-indigo-600">
          HADORI
        </Link>
        <nav className="hidden gap-6 text-sm text-zinc-600 sm:flex">
          <Link href="#features" className="hover:text-zinc-900">Features</Link>
          <Link href="#pricing" className="hover:text-zinc-900">Pricing</Link>
          <Link href="#about" className="hover:text-zinc-900">About</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Log in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/signup">Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
