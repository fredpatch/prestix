import { db } from "../../../db/index.js";
import { users, roleLevel } from "../../../db/schema.js";
import { eq, ilike, or, desc, and, count } from "drizzle-orm";
import { generateOTP, hashOTP, otpExpiresAt } from "../../../utils/otp.js";
import { sendOTPEmail } from "../../../utils/mailer.js";
import { logAudit } from "../../auth/services/auth.service.js";
import { toUserView } from "./users.helpers.js";
import type { CreateUserParams, UpdateUserParams, UserFilters, UserView } from "./users.types.js";
import { getIntValue } from "@/modules/settings/services/settings.service.js";

export type { CreateUserParams, UpdateUserParams, UserFilters, UserView } from "./users.types.js";

const ADMIN_MANAGED_ROLES = new Set(["admin", "super_admin"]); // Roles that can be managed by admins (not self-service).

// Count of currently active super_admins — the self-lockout guard checks against this.
async function activeSuperAdminCount(): Promise<number> {
  const [result] = await db
    .select({ total: count() })
    .from(users)
    .where(and(eq(users.role, "super_admin"), eq(users.active, true)));
  return result?.total ?? 0;
}

export async function listUsers(
  filters: UserFilters,
): Promise<{ data: UserView[]; total: number }> {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const offset = (page - 1) * pageSize;

  const conditions = [];
  if (filters.search) {
    conditions.push(
      or(ilike(users.fullName, `%${filters.search}%`), ilike(users.email, `%${filters.search}%`)),
    );
  }
  if (filters.role) conditions.push(eq(users.role, filters.role));
  if (filters.active !== undefined) conditions.push(eq(users.active, filters.active));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select()
    .from(users)
    .where(where)
    .orderBy(desc(users.createdAt))
    .limit(pageSize)
    .offset(offset);

  const total = await db.$count(users, where);

  return { data: rows.map(toUserView), total };
}

export async function getUser(id: number): Promise<UserView> {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  if (!user) throw new Error("USER_NOT_FOUND");
  return toUserView(user);
}

export async function createUser(
  params: CreateUserParams,
): Promise<{ user: UserView; emailSent: boolean }> {
  const [existing] = await db.select().from(users).where(eq(users.email, params.email));
  if (existing) throw new Error("EMAIL_ALREADY_EXISTS");

  if (ADMIN_MANAGED_ROLES.has(params.role)) {
    const [actor] = await db.select().from(users).where(eq(users.id, params.createdByUserId));
    if (actor?.role !== "super_admin") throw new Error("ONLY_SUPER_ADMIN_MANAGES_ADMINS");
  }

  const otp = generateOTP();
  const otpHash = await hashOTP(otp);
  const expiresAt = otpExpiresAt(await getIntValue("otp_expiration_minutes", 15));

  const [newUser] = await db
    .insert(users)
    .values({
      email: params.email,
      fullName: params.fullName,
      role: params.role,
      active: true,
      firstLogin: true,
      otpHash,
      otpExpiresAt: expiresAt,
    })
    .returning();

  let emailSent = true;
  try {
    await sendOTPEmail({ to: newUser.email, fullName: newUser.fullName, otp });
  } catch (error) {
    emailSent = false;
    console.error("[email] Failed to send OTP (user creation):", error);
  }

  await logAudit({
    userId: params.createdByUserId,
    action: "USER_CREATED",
    entityType: "users",
    entityId: String(newUser.id),
    metadata: { email: newUser.email, role: newUser.role },
  });

  return { user: toUserView(newUser), emailSent };
}

export async function updateUser(id: number, params: UpdateUserParams): Promise<UserView> {
  const [existing] = await db.select().from(users).where(eq(users.id, id));
  if (!existing) throw new Error("USER_NOT_FOUND");

  if (params.email !== undefined && params.email !== existing.email) {
    const [taken] = await db.select().from(users).where(eq(users.email, params.email));
    if (taken) throw new Error("EMAIL_ALREADY_EXISTS");
  }

  // Demoting the last active super_admin is blocked, same guard as deactivation below.
  if (
    params.role !== undefined &&
    params.role !== "super_admin" &&
    existing.role === "super_admin" &&
    existing.active
  ) {
    const activeCount = await activeSuperAdminCount();
    if (activeCount <= 1) throw new Error("LAST_SUPER_ADMIN");
  }

  const updates: Partial<typeof users.$inferInsert> = {};
  if (params.role !== undefined) updates.role = params.role;
  if (params.active !== undefined) updates.active = params.active;
  if (params.email !== undefined) updates.email = params.email;

  const [updated] = await db
    .update(users)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();

  await logAudit({
    userId: params.updatedByUserId,
    action: "USER_UPDATED",
    entityType: "users",
    entityId: String(id),
    metadata: updates,
  });

  return toUserView(updated);
}

export async function toggleActivation(
  id: number,
  active: boolean,
  adminId: number,
): Promise<UserView> {
  const [existing] = await db.select().from(users).where(eq(users.id, id));
  if (!existing) throw new Error("USER_NOT_FOUND");

  // ≥1 active super_admin enforced (M1 feasibility decision — count-based, not blanket).
  if (existing.role === "super_admin" && !active) {
    const activeCount = await activeSuperAdminCount();
    if (activeCount <= 1) throw new Error("LAST_SUPER_ADMIN");
  }

  const [updated] = await db
    .update(users)
    .set({ active, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();

  await logAudit({
    userId: adminId,
    action: active ? "USER_ACTIVATED" : "USER_DEACTIVATED",
    entityType: "users",
    entityId: String(id),
  });

  return toUserView(updated);
}

export async function resetOTP(id: number, adminId: number): Promise<{ emailSent: boolean }> {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  if (!user) throw new Error("USER_NOT_FOUND");
  if (!user.active) throw new Error("ACCOUNT_INACTIVE");

  const otp = generateOTP();
  const otpHash = await hashOTP(otp);
  const expiresAt = otpExpiresAt(await getIntValue("otp_expiration_minutes", 15));

  await db
    .update(users)
    .set({
      otpHash,
      otpExpiresAt: expiresAt,
      firstLogin: true,
      passwordHash: null,
      failedAttempts: 0,
      lockedUntil: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id));

  let emailSent = true;
  try {
    await sendOTPEmail({ to: user.email, fullName: user.fullName, otp });
  } catch (error) {
    emailSent = false;
    console.error("[email] Failed to send OTP (reset):", error);
  }

  await logAudit({
    userId: adminId,
    action: "OTP_RESET",
    entityType: "users",
    entityId: String(id),
  });

  return { emailSent };
}
