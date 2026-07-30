import { redirect } from "next/navigation";

/** Legacy URL — sign-in is a modal (BeSquare-style). */
export default function InloggenRedirect() {
  redirect("/?signin=1");
}
