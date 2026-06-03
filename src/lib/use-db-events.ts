"use client";

/** Mirrors server USE_DB_EVENTS for client components */
export function useDbEvents(): boolean {
  return process.env.NEXT_PUBLIC_USE_DB_EVENTS === "true";
}
