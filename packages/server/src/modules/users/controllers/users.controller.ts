import { Request, Response } from "express";
import * as usersService from "../services/users.service.js";
import { roleLevel } from "../../../db/schema.js";

function handleUsersError(res: Response, error: unknown): void {
  const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
  const status: Record<string, number> = {
    USER_NOT_FOUND: 404,
    EMAIL_ALREADY_EXISTS: 409,
    LAST_SUPER_ADMIN: 403,
    ACCOUNT_INACTIVE: 400,
  };
  const code = status[message] ?? 500;
  if (code === 500) console.error("[users]", error);
  res.status(code).json({ message, code: message });
}

export async function list(req: Request, res: Response): Promise<void> {
  try {
    const { search, role, active, page, pageSize } = req.query;
    const result = await usersService.listUsers({
      search: search as string | undefined,
      role: role as keyof typeof roleLevel | undefined,
      active: active !== undefined ? active === "true" : undefined,
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
    });
    res.json(result);
  } catch (error) {
    handleUsersError(res, error);
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ message: "Invalid ID." });
      return;
    }
    res.json(await usersService.getUser(id));
  } catch (error) {
    handleUsersError(res, error);
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const { email, fullName, role } = req.body;
    if (!email || !fullName || !role) {
      res.status(400).json({ message: "Required fields: email, fullName, role." });
      return;
    }
    if (!Object.keys(roleLevel).includes(role)) {
      res.status(400).json({ message: "Invalid role." });
      return;
    }

    const { user, emailSent } = await usersService.createUser({
      email,
      fullName,
      role,
      createdByUserId: req.user!.userId,
    });

    res.status(201).json({ ...user, emailSent });
  } catch (error) {
    handleUsersError(res, error);
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ message: "Invalid ID." });
      return;
    }

    const { role, active, email } = req.body;
    if (role === undefined && active === undefined && email === undefined) {
      res.status(400).json({ message: "No field to update." });
      return;
    }
    if (email !== undefined && !/^\S+@\S+\.\S+$/.test(email)) {
      res.status(400).json({ message: "Invalid email." });
      return;
    }

    const user = await usersService.updateUser(id, {
      role,
      active,
      email,
      updatedByUserId: req.user!.userId,
    });
    res.json(user);
  } catch (error) {
    handleUsersError(res, error);
  }
}

export async function toggleActivation(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ message: "Invalid ID." });
      return;
    }

    const { active } = req.body;
    if (typeof active !== "boolean") {
      res.status(400).json({ message: "Field 'active' must be a boolean." });
      return;
    }
    if (id === req.user!.userId && !active) {
      res.status(403).json({ message: "You cannot deactivate your own account." });
      return;
    }

    const user = await usersService.toggleActivation(id, active, req.user!.userId);
    res.json(user);
  } catch (error) {
    handleUsersError(res, error);
  }
}

export async function resetOTP(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ message: "Invalid ID." });
      return;
    }

    const { emailSent } = await usersService.resetOTP(id, req.user!.userId);
    res.json({
      message: emailSent
        ? "OTP reset and emailed."
        : "OTP reset, but email failed — check SMTP config.",
      emailSent,
    });
  } catch (error) {
    handleUsersError(res, error);
  }
}
