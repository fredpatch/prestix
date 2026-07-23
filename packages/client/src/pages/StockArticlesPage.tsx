import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  AlertTriangle,
  ArrowDown,
  ArrowRightLeft,
  ArrowUp,
  BadgeDollarSign,
  Check,
  CircleSlash,
  Eye,
  Loader2,
  PackageCheck,
  PackageSearch,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { type StockArticle, type StockMovement } from "@/lib/stock.api";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/App";
import { usePageHeader } from "@/components/layouts/lib/page-header";
import { CreateStockArticleDialog } from "./stock/CreateStockArticleDialog";
import { RestockDialog } from "./stock/RestockDialog";
import { useStockArticles } from "@/hooks/queries/useStockArticles";
import {
  type StockMovementWithArticle,
  useStockMovements,
} from "@/hooks/queries/useStockMovements";
import { useToggleStockArticleActivationMutation } from "@/hooks/mutations/useToggleStockArticleActivation";
import { DataTable } from "@/components/ui/data-table";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { UserKpiCard } from "./users/components/UserKpiCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useIsMobile";

const MOVEMENT_LABELS: Record<StockMovement["type"], string> = {
  IN: "Entrée",
  OUT: "Sortie",
  ADJUST: "Ajustement",
};

const MOVEMENT_TONES: Record<StockMovement["type"], string> = {
  IN: "bg-success-bg text-success-text border-success-border",
  OUT: "bg-danger-bg text-danger-text border-danger-border",
  ADJUST: "bg-warning-bg text-warning-text border-warning-border",
};

function money(value: string | number): string {
  const amount = typeof value === "number" ? value : parseFloat(value);
  return `${amount.toLocaleString("fr-FR")} XAF`;
}

function fmtDateTime(value: string): string {
  return new Date(value).toLocaleString("fr-FR");
}

function movementBadge(type: StockMovement["type"]) {
  return (
    <span
      className={cn(
        "inline-flex rounded border px-2 py-0.5 text-[10.5px] font-semibold",
        MOVEMENT_TONES[type],
      )}
    >
      {MOVEMENT_LABELS[type]}
    </span>
  );
}

function movementIcon(type: StockMovement["type"]) {
  if (type === "IN") return <ArrowUp size={13} />;
  if (type === "OUT") return <ArrowDown size={13} />;
  return <ArrowRightLeft size={13} />;
}

export default function StockArticlesPage() {
  const { user } = useAuth();
  const [includeInactive, setIncludeInactive] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<StockArticle | null>(null);
  const [selectedMovement, setSelectedMovement] = useState<StockMovementWithArticle | null>(null);
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  usePageHeader({
    title: "Stock",
    helpTopic: "stock",
    guide: {
      steps: [
        "Consultez le stock disponible par article.",
        "Utilisez « Réapprovisionner » pour enregistrer une entrée ou une correction.",
      ],
      tip: "Le stock ne peut jamais devenir négatif ici — contrairement à l'émission d'un document, où un manager+ peut passer outre.",
    },
  });

  const canManage = user && ["manager", "admin", "super_admin"].includes(user.role);

  const { data: articles = [], isLoading } = useStockArticles(includeInactive);
  const { data: movements = [], isLoading: loadingMovements } = useStockMovements(articles);
  const toggleMutation = useToggleStockArticleActivationMutation();

  // CreateStockArticleDialog isn't on this page's mutation hook (it's
  // shared with no cache-invalidation target of its own), so it still
  // needs this explicit invalidate via its onCreated prop.
  function handleReload() {
    queryClient.invalidateQueries({ queryKey: queryKeys.stock() });
    queryClient.invalidateQueries({ queryKey: queryKeys.stockMovements() });
  }

  function handleToggleActive(article: StockArticle) {
    toggleMutation.mutate({ id: article.id, active: !article.active });
  }

  const lowStock = articles.filter(
    (article) => article.active && article.onHand < article.minLevel,
  );
  const outOfStock = articles.filter((article) => article.active && article.onHand <= 0);
  const stockUnits = articles.reduce((sum, article) => sum + Math.max(article.onHand, 0), 0);
  const stockValue = articles.reduce(
    (sum, article) => sum + Math.max(article.onHand, 0) * parseFloat(article.defaultSupplierPrice),
    0,
  );
  const potentialGain = articles.reduce(
    (sum, article) =>
      sum +
      Math.max(article.onHand, 0) *
        (parseFloat(article.defaultSellingPrice) - parseFloat(article.defaultSupplierPrice)),
    0,
  );
  const negativeOverrides = movements.filter((movement) => movement.isNegativeOverride).length;

  const articleColumns: ColumnDef<StockArticle, any>[] = [
    {
      accessorKey: "name",
      header: "Article",
      cell: ({ row }) => (
        <span className="text-[12px] text-body">
          {row.original.name} <span className="text-subtle">({row.original.unit})</span>
        </span>
      ),
    },
    {
      accessorKey: "onHand",
      header: "En stock",
      meta: { align: "right" },
      cell: ({ row }) => (
        <span
          className={cn(
            "text-[12px] font-medium tabular-nums",
            row.original.onHand < row.original.minLevel ? "text-warning-text" : "text-body",
          )}
        >
          {row.original.onHand}
        </span>
      ),
    },
    {
      accessorKey: "minLevel",
      header: "Seuil bas",
      meta: { align: "right" },
      cell: ({ row }) => (
        <span className="text-[12px] tabular-nums text-muted-foreground">{row.original.minLevel}</span>
      ),
    },
    {
      accessorKey: "defaultSellingPrice",
      header: "Prix vente",
      meta: { align: "right" },
      cell: ({ row }) => (
        <span className="text-[12px] text-muted-foreground">
          {money(row.original.defaultSellingPrice)}
        </span>
      ),
    },
    {
      accessorKey: "active",
      header: "Statut",
      cell: ({ row }) => (
        <span
          className={cn(
            "inline-block rounded px-2 py-0.5 text-[10.5px] font-semibold",
            row.original.active ? "bg-success-bg text-success-text" : "bg-danger-bg text-danger-text",
          )}
        >
          {row.original.active ? "Actif" : "Désactivé"}
        </span>
      ),
    },
    ...(canManage
      ? [
          {
            id: "actions",
            header: "",
            meta: { align: "right" as const },
            cell: ({ row }: { row: { original: StockArticle } }) => (
              <div className="space-x-1 text-right">
                <RestockDialog article={row.original} onDone={handleReload} />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleToggleActive(row.original);
                  }}
                  title={row.original.active ? "Désactiver" : "Activer"}
                  disabled={toggleMutation.isPending}
                >
                  {row.original.active ? <CircleSlash size={14} /> : <Check size={14} />}
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ];

  const movementColumns: ColumnDef<StockMovementWithArticle, any>[] = [
    {
      id: "article",
      header: "Article",
      cell: ({ row }) => (
        <div>
          <p className="text-[12px] font-medium text-body">
            {row.original.article?.name ?? `Article #${row.original.articleId}`}
          </p>
          <p className="text-[10.5px] text-muted-foreground">
            Mouvement #{row.original.id} - agent #{row.original.agentId}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => movementBadge(row.original.type),
    },
    {
      accessorKey: "quantity",
      header: "Quantité",
      meta: { align: "right" },
      cell: ({ row }) => (
        <span className="text-[12px] font-medium tabular-nums text-body">
          {row.original.quantity} {row.original.article?.unit ?? ""}
        </span>
      ),
    },
    {
      id: "reference",
      header: "Référence",
      cell: ({ row }) => (
        <span className="text-[12px] text-muted-foreground">
          {row.original.refType ? `${row.original.refType} #${row.original.refId ?? "-"}` : "-"}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-[12px] text-muted-foreground">{fmtDateTime(row.original.createdAt)}</span>
      ),
    },
    {
      id: "detail",
      header: "",
      meta: { align: "right" },
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          title="Voir le détail"
          onClick={(event) => {
            event.stopPropagation();
            setSelectedMovement(row.original);
          }}
        >
          <Eye size={13} />
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Articles disponibles, mouvements de stock et alertes de seuil pour les opérations de
          vente.
        </p>
        {canManage && <CreateStockArticleDialog onCreated={handleReload} />}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <UserKpiCard
          label="Articles actifs"
          value={String(articles.filter((article) => article.active).length)}
          detail={`${articles.length} article${articles.length > 1 ? "s" : ""} affiché${articles.length > 1 ? "s" : ""}`}
          icon={PackageCheck}
          tone="gold"
        />
        <UserKpiCard
          label="Unités en stock"
          value={String(stockUnits)}
          detail="Quantité disponible"
          icon={PackageSearch}
          tone="success"
        />
        <UserKpiCard
          label="Valeur stock"
          value={money(stockValue)}
          detail="Au coût fournisseur"
          icon={BadgeDollarSign}
          tone="success"
        />
        <UserKpiCard
          label="Gain potentiel"
          value={money(potentialGain)}
          detail="Marge vente - fournisseur"
          icon={BadgeDollarSign}
          tone="gold"
        />
        <UserKpiCard
          label="Urgences"
          value={String(lowStock.length)}
          detail={`${outOfStock.length} rupture${outOfStock.length > 1 ? "s" : ""}`}
          icon={AlertTriangle}
          tone={lowStock.length > 0 ? "danger" : "neutral"}
        />
        <UserKpiCard
          label="Mouvements"
          value={loadingMovements ? "..." : String(movements.length)}
          detail={`${negativeOverrides} sortie${negativeOverrides > 1 ? "s" : ""} forcée${negativeOverrides > 1 ? "s" : ""}`}
          icon={RefreshCw}
          tone={negativeOverrides > 0 ? "danger" : "neutral"}
        />
      </div>

      <Tabs defaultValue="articles">
        <div className="mb-4 flex flex-col gap-3 border-y border-border py-3 lg:flex-row lg:items-center lg:justify-between">
          <TabsList className="w-fit border-b-0">
            <TabsTrigger value="articles">Articles</TabsTrigger>
            <TabsTrigger value="movements">Mouvements</TabsTrigger>
          </TabsList>

          <label className="flex h-10 w-fit items-center gap-2 rounded-lg border border-border bg-card px-3 text-[12px] text-body">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              className="accent-brand-gold-dark"
            />
            Inclure les articles désactivés
          </label>
        </div>

        <TabsContent value="articles">
          {isMobile ? (
            isLoading ? (
              <Loader2 className="animate-spin text-subtle" size={18} />
            ) : (
              <StockArticleGrid
                articles={articles}
                canManage={Boolean(canManage)}
                toggling={toggleMutation.isPending}
                onSelect={setSelectedArticle}
                onReload={handleReload}
                onToggleActive={handleToggleActive}
              />
            )
          ) : (
            <DataTable
              columns={articleColumns}
              data={articles}
              loading={isLoading}
              emptyMessage="Aucun article."
              onRowClick={setSelectedArticle}
            />
          )}
        </TabsContent>

        <TabsContent value="movements">
          {isMobile ? (
            loadingMovements ? (
              <Loader2 className="animate-spin text-subtle" size={18} />
            ) : (
              <StockMovementGrid movements={movements} onSelect={setSelectedMovement} />
            )
          ) : (
            <DataTable
              columns={movementColumns}
              data={movements}
              loading={loadingMovements}
              emptyMessage="Aucun mouvement de stock."
              onRowClick={setSelectedMovement}
            />
          )}
        </TabsContent>
      </Tabs>

      <ArticleDetailDialog
        article={selectedArticle}
        canManage={Boolean(canManage)}
        toggling={toggleMutation.isPending}
        onOpenChange={(open) => !open && setSelectedArticle(null)}
        onReload={handleReload}
        onToggleActive={handleToggleActive}
      />

      <MovementDetailDialog
        movement={selectedMovement}
        onOpenChange={(open) => !open && setSelectedMovement(null)}
      />
    </div>
  );
}

function StockArticleGrid({
  articles,
  canManage,
  toggling,
  onSelect,
  onReload,
  onToggleActive,
}: {
  articles: StockArticle[];
  canManage: boolean;
  toggling: boolean;
  onSelect: (article: StockArticle) => void;
  onReload: () => void;
  onToggleActive: (article: StockArticle) => void;
}) {
  if (articles.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card px-4 py-8 text-center text-[12px] text-muted-foreground">
        Aucun article.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {articles.map((article) => {
        const lowStock = article.active && article.onHand < article.minLevel;
        const supplierPrice = parseFloat(article.defaultSupplierPrice);
        const sellingPrice = parseFloat(article.defaultSellingPrice);

        return (
          <div key={article.id} className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-start justify-between gap-3">
              <button type="button" className="min-w-0 text-left" onClick={() => onSelect(article)}>
                <p className="truncate text-[13px] font-semibold text-foreground">
                  {article.name}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Article #{article.id} - unité {article.unit}
                </p>
              </button>
              <span
                className={cn(
                  "shrink-0 rounded border px-2 py-0.5 text-[10.5px] font-semibold",
                  article.active
                    ? "border-success-border bg-success-bg text-success-text"
                    : "border-danger-border bg-danger-bg text-danger-text",
                )}
              >
                {article.active ? "Actif" : "Désactivé"}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3 text-[11px]">
              <MobileFact
                label="En stock"
                value={`${article.onHand} ${article.unit}`}
                danger={lowStock}
              />
              <MobileFact label="Seuil bas" value={`${article.minLevel} ${article.unit}`} />
              <MobileFact label="Fournisseur" value={money(supplierPrice)} />
              <MobileFact label="Vente" value={money(sellingPrice)} />
            </div>

            {canManage && (
              <div className="mt-3 flex items-center justify-end gap-2">
                <RestockDialog article={article} onDone={onReload} />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onToggleActive(article)}
                  title={article.active ? "Désactiver" : "Activer"}
                  disabled={toggling}
                >
                  {article.active ? <CircleSlash size={14} /> : <Check size={14} />}
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function StockMovementGrid({
  movements,
  onSelect,
}: {
  movements: StockMovementWithArticle[];
  onSelect: (movement: StockMovementWithArticle) => void;
}) {
  if (movements.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card px-4 py-8 text-center text-[12px] text-muted-foreground">
        Aucun mouvement de stock.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {movements.map((movement) => (
        <button
          key={movement.id}
          type="button"
          className="rounded-lg border border-border bg-card p-3 text-left"
          onClick={() => onSelect(movement)}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-foreground">
                {movement.article?.name ?? `Article #${movement.articleId}`}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Mouvement #{movement.id} - {fmtDateTime(movement.createdAt)}
              </p>
            </div>
            {movementBadge(movement.type)}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3 text-[11px]">
            <MobileFact
              label="Quantité"
              value={`${movement.quantity} ${movement.article?.unit ?? ""}`}
            />
            <MobileFact label="Agent" value={`#${movement.agentId}`} />
            <MobileFact
              label="Référence"
              value={movement.refType ? `${movement.refType} #${movement.refId ?? "-"}` : "-"}
            />
            <MobileFact
              label="Sortie forcée"
              value={movement.isNegativeOverride ? "Oui" : "Non"}
              danger={movement.isNegativeOverride}
            />
          </div>
        </button>
      ))}
    </div>
  );
}

function ArticleDetailDialog({
  article,
  canManage,
  toggling,
  onOpenChange,
  onReload,
  onToggleActive,
}: {
  article: StockArticle | null;
  canManage: boolean;
  toggling: boolean;
  onOpenChange: (open: boolean) => void;
  onReload: () => void;
  onToggleActive: (article: StockArticle) => void;
}) {
  const supplierPrice = article ? parseFloat(article.defaultSupplierPrice) : 0;
  const sellingPrice = article ? parseFloat(article.defaultSellingPrice) : 0;
  const margin = sellingPrice - supplierPrice;
  const stockValue = article ? Math.max(article.onHand, 0) * supplierPrice : 0;
  const potentialGain = article ? Math.max(article.onHand, 0) * margin : 0;
  const lowStock = article ? article.active && article.onHand < article.minLevel : false;

  return (
    <Dialog open={Boolean(article)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88dvh] overflow-y-auto bg-card sm:max-w-2xl">
        {article && (
          <>
            <DialogHeader>
              <div className="flex flex-col gap-3 pr-8 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <DialogTitle className="text-[17px] font-bold text-foreground">
                    {article.name}
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-[12px] text-muted-foreground">
                    Article #{article.id} - unité {article.unit}
                  </DialogDescription>
                </div>
                <span
                  className={cn(
                    "w-fit rounded border px-2 py-0.5 text-[10.5px] font-semibold",
                    article.active
                      ? "border-success-border bg-success-bg text-success-text"
                      : "border-danger-border bg-danger-bg text-danger-text",
                  )}
                >
                  {article.active ? "Actif" : "Désactivé"}
                </span>
              </div>
            </DialogHeader>

            <div className="grid gap-3 sm:grid-cols-4">
              <DetailStat
                label="En stock"
                value={`${article.onHand} ${article.unit}`}
                danger={lowStock}
              />
              <DetailStat label="Seuil bas" value={`${article.minLevel} ${article.unit}`} />
              <DetailStat label="Valeur stock" value={money(stockValue)} />
              <DetailStat label="Gain potentiel" value={money(potentialGain)} />
            </div>

            <div className="overflow-hidden rounded-lg border border-border">
              <div className="border-b border-border bg-surface-muted px-4 py-2">
                <p className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Informations article
                </p>
              </div>
              <table className="w-full text-left">
                <tbody>
                  <DetailRow label="Nom" value={article.name} />
                  <DetailRow label="Unité" value={article.unit} />
                  <DetailRow label="Prix fournisseur" value={money(supplierPrice)} />
                  <DetailRow label="Prix vente" value={money(sellingPrice)} />
                  <DetailRow label="Marge unitaire" value={money(margin)} />
                  <DetailRow label="Statut stock" value={lowStock ? "Sous le seuil" : "Correct"} />
                </tbody>
              </table>
            </div>

            {lowStock && (
              <div className="rounded-lg border border-warning-border bg-warning-bg px-4 py-3">
                <p className="flex items-center gap-2 text-[12px] font-medium text-warning-text">
                  <AlertTriangle size={14} />
                  Cet article est sous son seuil bas.
                </p>
              </div>
            )}

            <DialogFooter>
              <Button variant="secondary" onClick={() => onOpenChange(false)}>
                Fermer
              </Button>
              {canManage && (
                <>
                  <RestockDialog article={article} onDone={onReload} />
                  <Button
                    variant="outline"
                    onClick={() => onToggleActive(article)}
                    disabled={toggling}
                  >
                    {article.active ? <CircleSlash size={13} /> : <Check size={13} />}
                    {article.active ? "Désactiver" : "Activer"}
                  </Button>
                </>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MovementDetailDialog({
  movement,
  onOpenChange,
}: {
  movement: StockMovementWithArticle | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={Boolean(movement)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88dvh] overflow-y-auto bg-card sm:max-w-2xl">
        {movement && (
          <>
            <DialogHeader>
              <div className="flex flex-col gap-3 pr-8 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <DialogTitle className="text-[17px] font-bold text-foreground">
                    Mouvement #{movement.id}
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-[12px] text-muted-foreground">
                    {movement.article?.name ?? `Article #${movement.articleId}`} -{" "}
                    {fmtDateTime(movement.createdAt)}
                  </DialogDescription>
                </div>
                {movementBadge(movement.type)}
              </div>
            </DialogHeader>

            <div className="grid gap-3 sm:grid-cols-3">
              <DetailStat
                label="Quantité"
                value={`${movement.quantity} ${movement.article?.unit ?? ""}`}
              />
              <DetailStat label="Agent" value={`#${movement.agentId}`} />
              <DetailStat
                label="Sortie forcée"
                value={movement.isNegativeOverride ? "Oui" : "Non"}
                danger={movement.isNegativeOverride}
              />
            </div>

            <div className="overflow-hidden rounded-lg border border-border">
              <div className="flex items-center gap-2 border-b border-border bg-surface-muted px-4 py-2">
                {movementIcon(movement.type)}
                <p className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Détail du mouvement
                </p>
              </div>
              <table className="w-full text-left">
                <tbody>
                  <DetailRow
                    label="Article"
                    value={movement.article?.name ?? `#${movement.articleId}`}
                  />
                  <DetailRow label="Unité" value={movement.article?.unit ?? "-"} />
                  <DetailRow label="Type" value={MOVEMENT_LABELS[movement.type]} />
                  <DetailRow
                    label="Référence"
                    value={movement.refType ? `${movement.refType} #${movement.refId ?? "-"}` : "-"}
                  />
                  <DetailRow label="Date" value={fmtDateTime(movement.createdAt)} />
                </tbody>
              </table>
            </div>

            {movement.isNegativeOverride && (
              <div className="rounded-lg border border-danger-border bg-danger-bg px-4 py-3">
                <p className="flex items-center gap-2 text-[12px] font-medium text-danger-text">
                  <ShieldAlert size={14} />
                  Ce mouvement contient une sortie forcée avec stock insuffisant.
                </p>
              </div>
            )}

            <DialogFooter>
              <Button variant="secondary" onClick={() => onOpenChange(false)}>
                Fermer
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DetailStat({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-card px-3 py-2">
      <p className="text-[10.5px] font-semibold uppercase tracking-wide text-subtle">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 truncate text-[12px] font-medium",
          danger ? "text-danger-text" : "text-body",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function MobileFact({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-surface-muted px-2.5 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-subtle">{label}</p>
      <p
        className={cn(
          "mt-1 break-words text-[12px] font-medium leading-tight",
          danger ? "text-danger-text" : "text-body",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-2 text-[12px] text-muted-foreground">{label}</td>
      <td className="px-4 py-2 text-right text-[12px] font-medium text-body">{value}</td>
    </tr>
  );
}
