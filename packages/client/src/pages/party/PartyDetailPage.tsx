import { useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { CreditCard, Download, FileText, Loader2, ReceiptText, Wallet } from "lucide-react";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/App";
import { EditPartyDialog } from "./EditPartyDialog";
import { SubscribeButton } from "./components/SubscribeButton";
import { SavingsTransactionDialog } from "./components/SavingsTransactionDialog";
import { ReverseSavingsTransactionDialog } from "./components/ReverseSavingsTransactionDialog";
import { usePageHeader } from "@/components/layouts/lib/page-header";
import { cn } from "@/lib/utils";
import { queryKeys } from "@/lib/query-keys";
import { useParty } from "@/hooks/queries/useParty";
import { usePartyCreditBalance } from "@/hooks/queries/usePartyCreditBalance";
import { usePartyCreditLots } from "@/hooks/queries/usePartyCreditLots";
import { usePartyHistory } from "@/hooks/queries/usePartyHistory";
import { useCreances } from "@/hooks/queries/useCreances";
import { usePartySavingsAccount } from "@/hooks/queries/usePartySavingsAccount";
import { usePartySavingsTransactions } from "@/hooks/queries/usePartySavingsTransactions";
import { useTogglePartyActivationMutation } from "@/hooks/mutations/useTogglePartyActivation";
import { PartyProfileHeader } from "./components/PartyProfileHeader";
import { PartyKpiCard } from "./components/PartyKpiCard";

const NATURE_LABELS: Record<string, string> = { deposit: "Dépôt", withdraw: "Retrait" };

function money(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const numeric = typeof value === "string" ? parseFloat(value) : value;
  return `${numeric.toLocaleString("fr-FR")} XAF`;
}

export default function PartyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const partyId = parseInt(id!);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(false);

  const { data: party, isLoading } = useParty(partyId);
  const { data: creditBalanceData } = usePartyCreditBalance(partyId);
  const creditBalance = creditBalanceData?.balance ?? null;
  const { data: creditLots = [] } = usePartyCreditLots(partyId);
  const { data: history = null } = usePartyHistory(partyId);
  const { data: creances = [] } = useCreances({ partyId });
  // Separate from the main queries — a party without a savings account is the
  // normal case (404), not an error the page should block on.
  const { data: savingsAccount = null } = usePartySavingsAccount(partyId);
  const { data: savingsTransactions = [] } = usePartySavingsTransactions(savingsAccount?.id);

  const toggleActivationMutation = useTogglePartyActivationMutation(partyId);

  // EditPartyDialog/SavingsTransactionDialog/SubscribeButton/
  // ReverseSavingsTransactionDialog aren't on useMutation yet (out of scope
  // for this pass), so they still need this explicit invalidate after their
  // own plain API calls. Same scope as the toggle-activation mutation above.
  function handleReload() {
    queryClient.invalidateQueries({ queryKey: queryKeys.party(partyId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.credits(partyId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.creditLots(partyId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.partyHistory(partyId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.creances({ partyId }) });
    queryClient.invalidateQueries({ queryKey: queryKeys.savings(partyId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.savingsTransactions() });
  }

  usePageHeader({ title: party?.fullName ?? "Partie", backTo: "/parties" });

  function handleToggleActivation() {
    if (!party) return;
    toggleActivationMutation.mutate(!party.active);
  }

  if (isLoading || !party) {
    return <Loader2 className="animate-spin text-neutral-400" size={18} />;
  }

  const canManage = user && ["manager", "admin", "super_admin"].includes(user.role);
  const canReverse = user && ["admin", "super_admin"].includes(user.role);
  const openLots = creditLots.filter((l) => !l.convertedAt && parseFloat(l.remainingAmount) > 0);
  const creancesTotal = creances.reduce(
    (sum, c) => sum + parseFloat(c.principalDue) + parseFloat(c.penaltyDue),
    0,
  );
  const overdueCount = creances.filter((c) => c.isOverdue).length;
  const recentCommercial = history?.commercial.data.slice(0, 3) ?? [];
  const recentSavings = savingsTransactions.slice(0, 3);

  return (
    <div>
      <PartyProfileHeader
        party={party}
        canManage={!!canManage}
        toggling={toggleActivationMutation.isPending}
        onEdit={() => setEditing(true)}
        onToggleActivation={handleToggleActivation}
      />

      {/* Three balances — never merged, per M3 spec */}
      <div className="grid grid-cols-1 gap-3 my-6 md:grid-cols-3">
        <PartyKpiCard
          label="Créances dues"
          value={creances.length === 0 ? "0 XAF" : money(creancesTotal)}
          detail={
            creances.length === 0
              ? "Aucune créance en cours"
              : `${creances.length} échéance${creances.length > 1 ? "s" : ""}${overdueCount > 0 ? ` · ${overdueCount} en retard` : ""}`
          }
          icon={ReceiptText}
          tone={creancesTotal > 0 ? "danger" : "neutral"}
        />
        <PartyKpiCard
          label="Crédit / Avoir"
          value={money(creditBalance)}
          detail={
            openLots.length > 0
              ? `${openLots.length} lot${openLots.length > 1 ? "s" : ""} ouvert${openLots.length > 1 ? "s" : ""}`
              : "Aucun lot ouvert"
          }
          icon={CreditCard}
          tone="gold"
        />
        <PartyKpiCard
          label="Épargne voyage"
          value={savingsAccount ? money(savingsAccount.balance) : "—"}
          detail={
            savingsAccount
              ? savingsAccount.subscriptionSource === "direct"
                ? "Souscription directe"
                : "Conversion crédit"
              : "Aucun compte ouvert"
          }
          icon={Wallet}
          tone={savingsAccount ? "gold" : "neutral"}
        />
      </div>

      {savingsAccount && (
        <div className="flex justify-end mb-4">
          <SavingsTransactionDialog account={savingsAccount} onRecorded={handleReload} />
        </div>
      )}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="credit">Lots de crédit</TabsTrigger>
          <TabsTrigger value="commercial">Historique commercial</TabsTrigger>
          <TabsTrigger value="epargne">Historique épargne</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
                <div>
                  <p className="text-[12px] font-semibold text-neutral-900">
                    Activité commerciale récente
                  </p>
                  <p className="text-[10.5px] text-neutral-500">
                    Factures et proformas liés à cette partie
                  </p>
                </div>
                <FileText size={15} className="text-neutral-400" />
              </div>
              {recentCommercial.length === 0 ? (
                <p className="px-4 py-6 text-[12px] text-neutral-500">
                  Aucun document commercial pour cette partie.
                </p>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {recentCommercial.map((entry) => (
                    <Link
                      key={`${entry.docType}-${entry.id}`}
                      to={
                        entry.docType === "invoice"
                          ? `/invoices/${entry.id}`
                          : `/proformas/${entry.id}`
                      }
                      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-neutral-50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-medium text-neutral-800">
                          {entry.docType === "invoice" ? "Facture" : "Proforma"}{" "}
                          {entry.number ?? `#${entry.id}`}
                        </p>
                        <p className="text-[10.5px] text-neutral-500">
                          {new Date(entry.date).toLocaleDateString("fr-FR")} · {entry.status}
                        </p>
                      </div>
                      <p className="shrink-0 text-[12.5px] font-semibold text-neutral-900">
                        {money(entry.amount)}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
                <div>
                  <p className="text-[12px] font-semibold text-neutral-900">Épargne récente</p>
                  <p className="text-[10.5px] text-neutral-500">
                    Derniers mouvements du compte voyage
                  </p>
                </div>
                <Wallet size={15} className="text-neutral-400" />
              </div>
              {!savingsAccount ? (
                <div className="px-4 py-6">
                  <p className="text-[12px] text-neutral-500">
                    Aucun compte épargne pour cette partie.
                  </p>
                  {canManage && (
                    <div className="mt-3">
                      <SubscribeButton partyId={partyId} onSubscribed={handleReload} />
                    </div>
                  )}
                </div>
              ) : recentSavings.length === 0 ? (
                <p className="px-4 py-6 text-[12px] text-neutral-500">
                  Aucun mouvement pour ce compte.
                </p>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {recentSavings.map((t) => (
                    <div key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-medium text-neutral-800">
                          {NATURE_LABELS[t.nature]}
                          {t.receiptNumber && (
                            <span className="ml-1 text-[10.5px] text-neutral-500">
                              {t.receiptNumber}
                            </span>
                          )}
                        </p>
                        <p className="text-[10.5px] text-neutral-500">
                          {t.recordedAt ? new Date(t.recordedAt).toLocaleString("fr-FR") : "—"}
                        </p>
                      </div>
                      <p className="shrink-0 text-[12.5px] font-semibold text-neutral-900">
                        {money(t.totalAmount)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="credit">
          {creditLots.length === 0 ? (
            <p className="text-[12px] text-neutral-500 py-4">
              Aucun lot de crédit pour cette partie.
            </p>
          ) : (
            <div className="space-y-2">
              {creditLots.map((lot) => (
                <div
                  key={lot.id}
                  className="bg-white border border-neutral-200 rounded-lg px-4 py-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-[12px] font-medium text-neutral-800">
                      {parseFloat(lot.remainingAmount).toLocaleString("fr-FR")} /{" "}
                      {parseFloat(lot.amount).toLocaleString("fr-FR")} XAF
                    </p>
                    <p className="text-[10.5px] text-neutral-500">
                      Créé le {new Date(lot.createdAt).toLocaleDateString("fr-FR")} · Fenêtre
                      jusqu'au {new Date(lot.decisionWindowExpiresAt).toLocaleDateString("fr-FR")}
                      {lot.convertedAt && " · Converti en épargne"}
                    </p>
                  </div>
                  {!lot.convertedAt && parseFloat(lot.remainingAmount) > 0 && (
                    <span className="text-[10.5px] text-emerald-600 font-medium">Ouvert</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="commercial">
          {!history || history.commercial.data.length === 0 ? (
            <p className="text-[12px] text-neutral-500 py-4">
              Aucun document commercial pour cette partie.
            </p>
          ) : (
            <div className="space-y-2 py-2">
              {history.commercial.data.map((entry) => (
                <Link
                  key={`${entry.docType}-${entry.id}`}
                  to={
                    entry.docType === "invoice" ? `/invoices/${entry.id}` : `/proformas/${entry.id}`
                  }
                  className="bg-white border border-neutral-200 rounded-lg px-4 py-3 flex items-center justify-between hover:border-brand-gold-dark transition-colors"
                >
                  <div>
                    <p className="text-[12px] font-medium text-neutral-800">
                      {entry.docType === "invoice" ? "Facture" : "Proforma"}{" "}
                      {entry.number ?? `#${entry.id}`}
                    </p>
                    <p className="text-[10.5px] text-neutral-500">
                      {new Date(entry.date).toLocaleDateString("fr-FR")} · {entry.status}
                    </p>
                  </div>
                  <p className="text-[13px] font-semibold text-neutral-800">
                    {parseFloat(entry.amount).toLocaleString("fr-FR")} XAF
                  </p>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="epargne">
          {!savingsAccount ? (
            <div className="py-4 space-y-3">
              <p className="text-[12px] text-neutral-500">
                Aucun compte épargne pour cette partie.
              </p>
              {canManage && <SubscribeButton partyId={partyId} onSubscribed={handleReload} />}
            </div>
          ) : savingsTransactions.length === 0 ? (
            <p className="text-[12px] text-neutral-500 py-4">Aucun mouvement pour ce compte.</p>
          ) : (
            <div className="space-y-2 py-2">
              {savingsTransactions.map((t) => (
                <div
                  key={t.id}
                  className="bg-white border border-neutral-200 rounded-lg px-4 py-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-[12px] font-medium text-neutral-800">
                      {NATURE_LABELS[t.nature]} —{" "}
                      {parseFloat(t.totalAmount).toLocaleString("fr-FR")} XAF
                      {t.reversalOfTransactionId && (
                        <span className="text-[10.5px] text-amber-600 ml-2">
                          (contre-passation)
                        </span>
                      )}
                      {!t.agentId && !t.reversalOfTransactionId && (
                        <span
                          className="text-[10.5px] text-blue-600 ml-2"
                          title="Converti automatiquement depuis un lot de crédit expiré, pas un dépôt en espèces"
                        >
                          (converti)
                        </span>
                      )}
                    </p>
                    <p className="text-[10.5px] text-neutral-500">
                      {t.recordedAt ? new Date(t.recordedAt).toLocaleString("fr-FR") : "—"}
                      {t.appliedToInvoiceId && ` · appliqué à la facture #${t.appliedToInvoiceId}`}
                      {t.receiptNumber && ` · ${t.receiptNumber}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {t.receiptNumber && (
                      <a
                        href={`/api/savings/transactions/${t.id}/receipt`}
                        target="_blank"
                        rel="noreferrer"
                        className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
                        title="Télécharger le reçu"
                      >
                        <Download size={13} />
                      </a>
                    )}
                    {canReverse && !t.reversalOfTransactionId && (
                      <ReverseSavingsTransactionDialog
                        transactionId={t.id}
                        onReversed={handleReload}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <EditPartyDialog
        party={editing ? party : null}
        onClose={() => setEditing(false)}
        onUpdated={handleReload}
      />
    </div>
  );
}
