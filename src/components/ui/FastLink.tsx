"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useCallback } from "react";

interface FastLinkProps {
  href: string;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}

export function FastLink({ href, className, children, onClick }: FastLinkProps) {
  const router = useRouter();
  const prefetchRoute = useCallback(() => {
    router.prefetch(href);
  }, [router, href]);

  return (
    <Link
      href={href}
      prefetch
      className={className}
      onClick={onClick}
      onPointerEnter={prefetchRoute}
      onTouchStart={prefetchRoute}
      onFocus={prefetchRoute}
    >
      {children}
    </Link>
  );
}
