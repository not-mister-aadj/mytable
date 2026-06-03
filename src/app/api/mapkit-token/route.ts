import { createMapKitToken, isMapKitConfigured } from "@/lib/mapkit-auth";

export async function GET() {
  if (!isMapKitConfigured()) {
    return new Response("MapKit not configured", { status: 503 });
  }

  const token = await createMapKitToken();
  if (!token) {
    return new Response("Failed to create token", { status: 500 });
  }

  return new Response(token, {
    headers: { "Content-Type": "text/plain" },
  });
}
