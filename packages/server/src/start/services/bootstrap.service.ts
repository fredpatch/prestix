import bcrypt from "bcrypt";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";
import { eq, count } from "drizzle-orm";
import { logAudit } from "../../modules/auth/services/auth.service.js";

const SALT_ROUNDS = 10;

// System is initialized once at least one super_admin exists
export async function isInitialized(): Promise<boolean> {
  const [result] = await db
    .select({ total: count() })
    .from(users)
    .where(eq(users.role, "super_admin"));

  return (result?.total ?? 0) > 0;
}

export async function initializeSuperAdmin(params: {
  fullName: string;
  email: string;
  password: string;
}): Promise<void> {
  const { fullName, email, password } = params;

  const alreadyInitialized = await isInitialized();
  if (alreadyInitialized) {
    throw new Error("SYSTEM_ALREADY_INITIALIZED");
  }

  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (existing) {
    throw new Error("EMAIL_ALREADY_EXISTS");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const [superAdmin] = await db
    .insert(users)
    .values({
      email,
      fullName,
      passwordHash,
      role: "super_admin",
      active: true,
      activatedAt: new Date(), // direct login, no OTP for bootstrap
      firstLogin: false,
    })
    .returning();

  await logAudit({
    userId: superAdmin.id,
    action: "BOOTSTRAP_SUPER_ADMIN_CREATED",
    entityType: "users",
    entityId: String(superAdmin.id),
    metadata: { email },
  });
}
