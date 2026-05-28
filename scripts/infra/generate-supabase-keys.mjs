import { createHmac, randomBytes } from "node:crypto";

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

function signJwt(payload, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signature = createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64url");

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

const now = Math.floor(Date.now() / 1000);
const tenYears = 60 * 60 * 24 * 365 * 10;
const jwtSecret = randomBytes(48).toString("hex");

const anonKey = signJwt(
  {
    role: "anon",
    iss: "supabase",
    iat: now,
    exp: now + tenYears,
  },
  jwtSecret,
);

const serviceRoleKey = signJwt(
  {
    role: "service_role",
    iss: "supabase",
    iat: now,
    exp: now + tenYears,
  },
  jwtSecret,
);

console.log(`# Segredos novos para infra/bradox-revenda.env.example`);
console.log(`POSTGRES_PASSWORD=${randomBytes(24).toString("base64url")}`);
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`ANON_KEY=${anonKey}`);
console.log(`SERVICE_ROLE_KEY=${serviceRoleKey}`);
console.log(`SECRET_KEY_BASE=${randomBytes(64).toString("hex")}`);
console.log(`VITE_BRADOX_SUPABASE_ANON_KEY=${anonKey}`);