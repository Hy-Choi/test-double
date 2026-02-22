"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/search", label: "Search" },
  { href: "/admin/song-new", label: "Song Admin" },
  { href: "/admin/search-weight", label: "Weight" }
];

export default function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 mb-8 border-b border-[#e2e8f3]/90 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="inline-flex items-center gap-2">
          <svg viewBox="0 0 48 48" className="h-7 w-7 text-[#0f172c]" fill="none" aria-hidden>
            <path
              d="M42.4 44S36.1 33.9 41.2 24C46.9 12.9 42.2 4 42.2 4H7s4.6 8.9-1 20c-5.1 9.9 1.3 20 1.3 20h35.1Z"
              fill="currentColor"
            />
          </svg>
          <span className="text-base font-semibold uppercase tracking-[0.2em] text-[#2f3849]">TwoLine</span>
        </Link>

        <nav className="flex items-center gap-2 md:gap-6">
          {links.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`border-b-2 px-1 py-2 text-sm font-semibold transition ${
                  active
                    ? "border-[#1f57d9] text-[#1f57d9]"
                    : "border-transparent text-[#647997] hover:border-[#1f57d9] hover:text-[#1f57d9]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
