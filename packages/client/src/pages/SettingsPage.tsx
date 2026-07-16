import { useEffect, useState } from "react";
import { Loader2, Save, Plus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import { EditCommissionTypeDialog } from "./commission/EditCommissionTypeDialog";
import { usePageHeader } from "@/components/layouts/lib/page-header";

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
