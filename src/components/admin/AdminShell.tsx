"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

export type AdminNavItem = {
  label: string;
  href: string;
  /** Match pathname exactly (use for dashboard root). */
  exact?: boolean;
};

function normalizePath(path: string): string {
  const base = path.split("?")[0].replace(/\/$/, "");
  return base || "/";
}

function isNavActive(pathname: string, href: string, exact?: boolean): boolean {
  const path = normalizePath(pathname);
  const target = normalizePath(href);

  if (exact) {
    return path === target;
  }

  return path === target || path.startsWith(`${target}/`);
}

interface AdminShellProps {
  children: ReactNode;
  userEmail: string;
  brandHref: string;
  navItems: AdminNavItem[];
  signOutAction: () => Promise<void>;
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      aria-hidden
    >
      {open ? (
        <>
          <path d="M6 6l12 12M18 6L6 18" />
        </>
      ) : (
        <>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </>
      )}
    </svg>
  );
}

function SidebarNav({
  navItems,
  pathname,
  onNavigate,
}: {
  navItems: AdminNavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-1" aria-label="Admin navigatie">
      {navItems.map((item) => {
        const active = isNavActive(pathname, item.href, item.exact);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors duration-200 ${
              active
                ? "bg-burgundy text-cream shadow-sm"
                : "text-wine/80 hover:bg-burgundy/[0.06] hover:text-burgundy"
            }`}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter({
  userEmail,
  signOutAction,
}: {
  userEmail: string;
  signOutAction: () => Promise<void>;
}) {
  return (
    <div className="mt-auto border-t border-border-subtle pt-5">
      <p className="truncate text-xs text-wine/50" title={userEmail}>
        {userEmail}
      </p>
      <form action={signOutAction} className="mt-3">
        <button
          type="submit"
          className="w-full rounded-xl px-3.5 py-2 text-left text-sm text-wine/70 transition-colors duration-200 hover:bg-burgundy/[0.06] hover:text-burgundy"
        >
          Uitloggen
        </button>
      </form>
    </div>
  );
}

export function AdminShell({
  children,
  userEmail,
  brandHref,
  navItems,
  signOutAction,
}: AdminShellProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="min-h-screen bg-cream text-wine">
      {/* Mobile header */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b border-border-subtle bg-beige/95 px-4 backdrop-blur-sm lg:hidden">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-burgundy transition-colors hover:bg-burgundy/[0.06]"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="admin-sidebar"
          aria-label={menuOpen ? "Menu sluiten" : "Menu openen"}
        >
          <MenuIcon open={menuOpen} />
        </button>
        <Link
          href={brandHref}
          className="font-serif text-lg text-burgundy"
          onClick={closeMenu}
        >
          MyTable Admin
        </Link>
      </header>

      {/* Mobile overlay */}
      {menuOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-wine/20 backdrop-blur-[1px] lg:hidden"
          aria-label="Menu sluiten"
          onClick={closeMenu}
        />
      ) : null}

      {/* Sidebar */}
      <aside
        id="admin-sidebar"
        className={`fixed left-0 top-0 z-50 flex h-screen w-60 flex-col border-r border-border-subtle bg-beige p-6 transition-transform duration-300 ease-out lg:translate-x-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Link
          href={brandHref}
          className="mb-8 font-serif text-xl leading-tight text-burgundy transition-opacity hover:opacity-80"
          onClick={closeMenu}
        >
          MyTable Admin
        </Link>

        <SidebarNav
          navItems={navItems}
          pathname={pathname}
          onNavigate={closeMenu}
        />

        <SidebarFooter userEmail={userEmail} signOutAction={signOutAction} />
      </aside>

      {/* Main content */}
      <div className="lg:pl-60">
        <main className="mx-auto max-w-6xl px-6 pb-10 pt-20 lg:px-8 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
