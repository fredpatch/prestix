import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Save, Plus, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { DataTable } from "@/components/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { settingsApi, type Setting } from "@/lib/settings.api";
import { featureFlagsApi, type FeatureFlag } from "@/lib/feature-flags.api";
import { commissionCatalogApi, type CommissionType } from "@/lib/commission-catalog.api";
import { usersApi } from "@/lib/users.api";
import type { AuditLogRow } from "@/lib/audit-log.api";
import {
  useAuditLog,
  useAuditLogActions,
  useAuditLogEntityTypes,
} from "@/hooks/queries/useAuditLog";
import { EditCommissionTypeDialog } from "./commission/EditCommissionTypeDialog";
import { usePageHeader } from "@/components/layouts/lib/page-header";
import { useAuth } from "@/App";
import { savingsApi } from "@/lib/savings.api";

const MODULE_LABELS: Record<string, string> = {
  auth: "Authentification",
  settings: "Paramètres",
  party: "Clients & référents",
  documents: "Documents",
  payments: "Paiements",
  penalties: "Pénalités",
  remises: "Remises",
  billetterie: "Billetterie",
  shop: "PrestiShop",
  commission: "Commissions",
  epargne: "Épargne voyage",
  dashboard: "Tableau de bord",
  papeterie: "Papeterie",
};

export default function SettingsPage() {
  usePageHeader({ title: "Paramètres" });

  return (
    <div>
      <p className="text-neutral-500 text-sm mb-6">
        Paramètres financiers, visibilité des modules et catalogue de commissions.
      </p>

      <Tabs defaultValue="financial">
        <TabsList>
          <TabsTrigger value="financial">Paramètres financiers</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="catalog">Catalogue commissions</TabsTrigger>
          <TabsTrigger value="audit">Journal d'audit</TabsTrigger>
        </TabsList>

        <TabsContent value="financial">
          <FinancialSettingsTab />
        </TabsContent>
        <TabsContent value="modules">
          <ModulesTab />
        </TabsContent>
        <TabsContent value="catalog">
          <CatalogTab />
        </TabsContent>
        <TabsContent value="audit">
          <AuditLogTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Financial params ─────────────────────────────────────────────────────

function FinancialSettingsTab() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    settingsApi.list().then((res) => {
      setSettings(res.data);
      setDrafts(Object.fromEntries(res.data.map((s) => [s.key, s.value])));
      setLoading(false);
    });
  }, []);

  async function handleSave(key: string) {
    setSaving(key);
    try {
      await settingsApi.update(key, drafts[key]);
      setSettings((prev) => prev.map((s) => (s.key === key ? { ...s, value: drafts[key] } : s)));
    } finally {
      setSaving(null);
    }
  }

  if (loading) return <Loader2 className="animate-spin text-neutral-400" size={18} />;

  const grouped = settings.reduce<Record<string, Setting[]>>((acc, s) => {
    (acc[s.module] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([module, items]) => (
        <div key={module}>
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500 mb-2">
            {MODULE_LABELS[module] ?? module}
          </h3>
          <div className="space-y-2">
            {items.map((s) => {
              const dirty = drafts[s.key] !== s.value;
              return (
                <div
                  key={s.key}
                  className="flex items-center gap-3 bg-white border border-neutral-200 rounded-lg px-4 py-2.5"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-neutral-800">{s.key}</p>
                    {s.description && (
                      <p className="text-[10.5px] text-neutral-500 truncate">{s.description}</p>
                    )}
                  </div>
                  <Input
                    value={drafts[s.key] ?? ""}
                    onChange={(e) => setDrafts((d) => ({ ...d, [s.key]: e.target.value }))}
                    className="w-40 h-8 text-sm"
                  />
                  <Button
                    size="sm"
                    variant={dirty ? "default" : "secondary"}
                    disabled={!dirty || saving === s.key}
                    onClick={() => handleSave(s.key)}
                  >
                    {saving === s.key ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Save size={13} />
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <CreditConversionTool />
    </div>
  );
}

// Manual trigger for the M11 auto-conversion cron — same pattern as Sprint 5's
// penalty accrual manual trigger: a legitimate standing admin feature (force
// a check after fixing a settings mistake), not just a test hook.
function CreditConversionTool() {
  const { user } = useAuth();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  if (!user || user.role !== "super_admin") return null;

  async function handleTrigger() {
    setRunning(true);
    setResult(null);
    try {
      const res = await savingsApi.triggerConversion();
      setResult(
        `${res.data.converted} converti(s), ${res.data.heldForReview} en attente de révision.`,
      );
    } catch (err: unknown) {
      setResult(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Erreur lors du déclenchement.",
      );
    } finally {
      setRunning(false);
    }
  }

  return (
    <div>
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500 mb-2">
        Outils
      </h3>
      <div className="bg-white border border-neutral-200 rounded-lg px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-[12px] font-medium text-neutral-800">
            Conversion crédit expiré → épargne
          </p>
          <p className="text-[10.5px] text-neutral-500">
            Déclenche manuellement la conversion des lots de crédit dont la fenêtre de décision est
            expirée (normalement automatique, une fois par jour).
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={handleTrigger} disabled={running}>
          {running ? <Loader2 size={13} className="animate-spin" /> : "Déclencher"}
        </Button>
      </div>
      {result && <p className="text-[10.5px] text-neutral-500 mt-1.5">{result}</p>}
    </div>
  );
}

// ── Feature flags ─────────────────────────────────────────────────────────

function ModulesTab() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    featureFlagsApi.list().then((res) => {
      setFlags(res.data);
      setLoading(false);
    });
  }, []);

  async function handleToggle(moduleCode: string, enabled: boolean) {
    setFlags((prev) => prev.map((f) => (f.moduleCode === moduleCode ? { ...f, enabled } : f)));
    await featureFlagsApi.toggle(moduleCode, enabled);
  }

  if (loading) return <Loader2 className="animate-spin text-neutral-400" size={18} />;

  return (
    <div className="space-y-2">
      {flags.map((f) => (
        <div
          key={f.moduleCode}
          className="flex items-center justify-between bg-white border border-neutral-200 rounded-lg px-4 py-2.5"
        >
          <span className="text-[12px] font-medium text-neutral-800">
            {MODULE_LABELS[f.moduleCode] ?? f.moduleCode}
          </span>
          <Switch checked={f.enabled} onCheckedChange={(v) => handleToggle(f.moduleCode, v)} />
        </div>
      ))}
    </div>
  );
}

// ── Commission catalog ──────────────────────────────────────────────────

function CatalogTab() {
  const [types, setTypes] = useState<CommissionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  function reload() {
    commissionCatalogApi.list().then((res) => {
      setTypes(res.data);
      setLoading(false);
    });
  }

  useEffect(reload, []);

  async function handleToggle(code: string, active: boolean) {
    setTypes((prev) => prev.map((t) => (t.code === code ? { ...t, active } : t)));
    await commissionCatalogApi.toggleActive(code, active);
  }

  async function handleCreate() {
    setCreateError(null);
    setCreating(true);
    try {
      await commissionCatalogApi.create({ code: newCode, label: newLabel });
      setDialogOpen(false);
      setNewCode("");
      setNewLabel("");
      reload();
    } catch (err: unknown) {
      setCreateError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Erreur lors de la création.",
      );
    } finally {
      setCreating(false);
    }
  }

  if (loading) return <Loader2 className="animate-spin text-neutral-400" size={18} />;

  return (
    <div>
      <div className="flex justify-end mb-3">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <Button size="sm">
              <Plus size={14} /> Nouveau type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouveau type de commission</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="block text-[11.5px] font-medium text-neutral-800 mb-1.5">
                  Code
                </label>
                <Input
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="ex: partenariat_hotel"
                />
              </div>
              <div>
                <label className="block text-[11.5px] font-medium text-neutral-800 mb-1.5">
                  Libellé
                </label>
                <Input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="ex: Partenariat Hôtel"
                />
              </div>
              {createError && <p className="text-[11px] text-red-600">{createError}</p>}
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreate} disabled={creating || !newCode || !newLabel}>
                {creating ? <Loader2 size={13} className="animate-spin" /> : "Créer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {types.map((t) => (
          <div
            key={t.code}
            className="flex items-center justify-between bg-white border border-neutral-200 rounded-lg px-4 py-2.5"
          >
            <div>
              <p className="text-[12px] font-medium text-neutral-800">{t.label}</p>
              <p className="text-[10.5px] text-neutral-500">{t.code}</p>
            </div>
            <div className="flex items-center gap-2">
              <EditCommissionTypeDialog type={t} onUpdated={reload} />
              <Switch checked={t.active} onCheckedChange={(v) => handleToggle(t.code, v)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Audit log ────────────────────────────────────────────────────────────
// Pure display layer over the audit_log table every module already writes
// to via logAudit() — no new tracking. Backend route is admin+ only
// (packages/server/src/modules/audit-log), stricter than reporting's
// agent+ read, since this exposes every action by every user unfiltered.

const PAGE_SIZE = 10;

function humanizeAction(action: string): string {
  const lower = action.replace(/_/g, " ").toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function AuditLogTab() {
  const [userId, setUserId] = useState<number | undefined>(undefined);
  const [action, setAction] = useState<string | undefined>(undefined);
  const [entityType, setEntityType] = useState<string | undefined>(undefined);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const filters = { userId, action, entityType, from: from || undefined, to: to || undefined };

  const { data, isLoading } = useAuditLog({ ...filters, page, pageSize: PAGE_SIZE });
  const { data: actions = [] } = useAuditLogActions();
  const { data: entityTypes = [] } = useAuditLogEntityTypes();

  // Lightweight lookup for the user filter — not the paginated useUsers()
  // hook (defaults to 20/page), just names for a dropdown.
  const { data: userOptions = [] } = useQuery({
    queryKey: ["users", "audit-log-lookup"],
    queryFn: () => usersApi.list({ pageSize: 200 }).then((r) => r.data.data),
  });

  const rows = data?.data ?? [];
  const total = data?.total ?? 0;

  function resetFilters() {
    setUserId(undefined);
    setAction(undefined);
    setEntityType(undefined);
    setFrom("");
    setTo("");
    setPage(1);
  }

  // Every filter setter below also resets page to 1 — changing a filter
  // mid-pagination should never leave the user stranded on a page number
  // that no longer has that many results.
  const columns: ColumnDef<AuditLogRow, any>[] = [
    {
      accessorKey: "createdAt",
      header: "Date / heure",
      cell: ({ row }) => (
        <span className="text-[12px] text-neutral-600">
          {format(parseISO(row.original.createdAt), "dd MMM yyyy HH:mm", { locale: fr })}
        </span>
      ),
    },
    {
      accessorKey: "actorName",
      header: "Utilisateur",
      cell: ({ row }) => (
        <span className="text-[12px] text-neutral-800">{row.original.actorName ?? "Système"}</span>
      ),
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => (
        <span className="text-[12px] text-neutral-800" title={row.original.action}>
          {humanizeAction(row.original.action)}
        </span>
      ),
    },
    {
      accessorKey: "entityType",
      header: "Entité",
      cell: ({ row }) => (
        <span className="text-[12px] text-neutral-500">
          {row.original.entityType}
          {row.original.entityId ? ` #${row.original.entityId}` : ""}
        </span>
      ),
    },
    {
      id: "details",
      header: "Détails",
      cell: ({ row }) => {
        const metadata = row.original.metadata;
        if (!metadata || Object.keys(metadata).length === 0) {
          return <span className="text-[12px] text-neutral-300">—</span>;
        }
        return (
          <Popover>
            <PopoverTrigger type="button" className="text-neutral-400 hover:text-neutral-600">
              <Info size={14} />
            </PopoverTrigger>
            <PopoverContent className="w-72 text-[11px] space-y-1">
              {Object.entries(metadata).map(([key, value]) => (
                <div key={key} className="flex justify-between gap-2">
                  <span className="text-neutral-500">{key}</span>
                  <span className="text-neutral-800 text-right break-all">{String(value)}</span>
                </div>
              ))}
            </PopoverContent>
          </Popover>
        );
      },
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <Select
          value={userId !== undefined ? String(userId) : "__all__"}
          onValueChange={(v) => {
            setUserId(v === "__all__" ? undefined : parseInt(v));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Tous les utilisateurs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tous les utilisateurs</SelectItem>
            {userOptions.map((u) => (
              <SelectItem key={u.id} value={String(u.id)}>
                {u.fullName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={action ?? "__all__"}
          onValueChange={(v) => {
            setAction(v === "__all__" ? undefined : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Toutes les actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Toutes les actions</SelectItem>
            {actions.map((a) => (
              <SelectItem key={a} value={a}>
                {humanizeAction(a)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={entityType ?? "__all__"}
          onValueChange={(v) => {
            setEntityType(v === "__all__" ? undefined : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Toutes les entités" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Toutes les entités</SelectItem>
            {entityTypes.map((e) => (
              <SelectItem key={e} value={e}>
                {e}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DatePicker
          value={from}
          onChange={(v) => {
            setFrom(v);
            setPage(1);
          }}
          placeholder="Depuis"
          className="w-40"
        />
        <DatePicker
          value={to}
          onChange={(v) => {
            setTo(v);
            setPage(1);
          }}
          placeholder="Jusqu'à"
          className="w-40"
        />

        <Button variant="secondary" size="sm" onClick={resetFilters}>
          Réinitialiser
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        loading={isLoading}
        emptyMessage="Aucune entrée trouvée."
      />

      <div className="flex items-center justify-between mt-3">
        <p className="text-[11px] text-neutral-500">
          {total} entrée{total !== 1 ? "s" : ""}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft size={13} />
          </Button>
          <span className="text-[11px] text-neutral-500">
            Page {page} / {Math.max(1, Math.ceil(total / PAGE_SIZE))}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page * PAGE_SIZE >= total}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight size={13} />
          </Button>
        </div>
      </div>
    </div>
  );
}
