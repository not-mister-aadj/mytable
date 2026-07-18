"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type MouseEvent, type ReactNode, useCallback } from "react";

interface FastLinkProps {
  href: string;
  className?: string;
  children: ReactNode;
  tabIndex?: number;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
}

export function FastLink({ href, className, children, tabIndex, onClick }: FastLinkProps) {
  const router = useRouter();
  const prefetchRoute = useCallback(() => {
    router.prefetch(href);
  }, [router, href]);

  return (
    <Link
      href={href}
      prefetch
      className={className}
      tabIndex={tabIndex}
      onClick={onClick}
      onPointerEnter={prefetchRoute}
      onTouchStart={prefetchRoute}
      onFocus={prefetchRoute}
    >
      {children}
    </Link>
  );
}
