import { NextResponse } from "next/server";
import { getMemberUser } from "@/lib/member-auth";
import { setProfilePhoto } from "@/lib/profile-photo";

/** "Profielfoto" in the account settings (POST multipart, field "photo"). */
export async function POST(request: Request) {
  const user = await getMemberUser();
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await request.formData().catch(() => null);
  const file = form?.get("photo");
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "No photo" }, { status: 400 });
  const result = await setProfilePhoto(user.email, file);
  return result.ok ? NextResponse.json({ url: result.url }) : NextResponse.json({ error: result.error }, { status: 400 });
}
