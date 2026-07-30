import type { Metadata } from "next";
import { NotFoundView } from "@/components/NotFoundView";

export const metadata: Metadata = {
  title: "Pagina niet gevonden | MyTable",
  robots: { index: false, follow: false },
};

export default function LocaleNotFound() {
  return <NotFoundView />;
}
