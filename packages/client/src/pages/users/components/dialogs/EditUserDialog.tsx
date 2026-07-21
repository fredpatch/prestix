import { useEffect, useState } from "react";
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
import { type Role, type User } from "@/lib/users.api";
import { useAuth } from "@/App";
import { useUpdateUserMutation } from "@/hooks/mutations/useUpdateUser";

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
  const updateMutation = useUpdateUserMutation();

  useEffect(() => {
    if (targetUser) {
      setEmail(targetUser.email);
      setRole(targetUser.role);
    }
  }, [targetUser]);

  const isManagedAdmin = targetUser && ["admin", "super_admin"].includes(targetUser.role);
  const canEditRole = user?.role === "super_admin" || !isManagedAdmin;

  function handleSubmit() {
    if (!targetUser) return;
    updateMutation.mutate(
      { id: targetUser.id, data: { email, role: canEditRole ? role : undefined } },
      {
        onSuccess: () => {
          onUpdated();
          onClose();
        },
      },
    );
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
          </div>
        )}

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={updateMutation.isPending || !email}>
            {updateMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
