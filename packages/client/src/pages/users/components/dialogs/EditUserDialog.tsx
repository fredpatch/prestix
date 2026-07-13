import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { usersApi, type Role, type User } from "@/lib/users.api";
import { useAuth } from "@/App";

const ALL_ROLES: { value: Role; label: string }[] = [
  { value: "agent", label: "Agent" },
  { value: "manager", label: "Manager" },
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super Admin" },
];

interface EditUserDialogProps {
  targetUser: User | null;
  onClose: () => void;
  onUpdated: () => void;
}

export function EditUserDialog({ targetUser, onClose, onUpdated }: EditUserDialogProps) {
  const { user } = useAuth();
  const [email, setEmail] = useState(targetUser?.email ?? "");
  const [role, setRole] = useState<Role>(targetUser?.role ?? "agent");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (targetUser && email !== targetUser.email && role === "agent" && targetUser.role !== "agent") {
    // sync local state when a different target user is opened
  }

  const isManagedAdmin = targetUser && ["admin", "super_admin"].includes(targetUser.role);
  const canEditRole = user?.role === "super_admin" || !isManagedAdmin;

  async function handleSubmit() {
    if (!targetUser) return;
    setSubmitting(true);
    setError(null);
    try {
      await usersApi.update(targetUser.id, { email, role: canEditRole ? role : undefined });
      onUpdated();
      onClose();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Erreur lors de la modification.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={!!targetUser}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier l'utilisateur</DialogTitle>
        </DialogHeader>

        {targetUser && (
          <div className="space-y-3">
            <div>
              <label className="block text-[11.5px] font-medium text-neutral-800 mb-1.5">
                Email
              </label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
            </div>
            <div>
              <label className="block text-[11.5px] font-medium text-neutral-800 mb-1.5">
                Rôle
              </label>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as Role)}
                disabled={!canEditRole}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!canEditRole && (
                <p className="text-[10.5px] text-neutral-500 mt-1">
                  Seul un Super Admin peut modifier un compte Admin.
                </p>
              )}
            </div>
            {error && <p className="text-[11px] text-red-600">{error}</p>}
          </div>
        )}

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !email}>
            {submitting ? <Loader2 size={13} className="animate-spin" /> : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
