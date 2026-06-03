import { SignJWT, importPKCS8 } from "jose";

function getMapKitPrivateKey(): string | null {
  const raw = process.env.MAPKIT_PRIVATE_KEY;
  if (!raw) return null;
  return raw.replace(/\\n/g, "\n");
}

export function isMapKitConfigured(): boolean {
  return Boolean(
    process.env.MAPKIT_TEAM_ID &&
      process.env.MAPKIT_KEY_ID &&
      getMapKitPrivateKey(),
  );
}

export async function createMapKitToken(): Promise<string | null> {
  const teamId = process.env.MAPKIT_TEAM_ID;
  const keyId = process.env.MAPKIT_KEY_ID;
  const privateKeyPem = getMapKitPrivateKey();

  if (!teamId || !keyId || !privateKeyPem) return null;

  const privateKey = await importPKCS8(privateKeyPem, "ES256");

  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: keyId, typ: "JWT" })
    .setIssuer(teamId)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(privateKey);
}
