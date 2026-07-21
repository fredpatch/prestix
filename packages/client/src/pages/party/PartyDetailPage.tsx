import { useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { Loader2, Power, Pencil, Download } from "lucide-react";
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

const NATURE_LABELS: Record<string, string> = { deposit: "Dépôt", withdraw: "Retrait" };

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
  const creancesTotal = creances.reduce((sum, c) => sum + parseFloat(c.principalDue) + parseFloat(c.penaltyDue), 0);
  const overdueCount = creances.filter((c) => c.isOverdue).length;

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mt-1">
            {party.code && <span className="text-[11px] text-neutral-500">{party.code}</span>}
            {party.isClient && (
              <span className="inline-block px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10.5px]">
                Client
              </span>
            )}
            {party.isReferrer && (
              <span className="inline-block px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 text-[10.5px]">
                Référent
              </span>
            )}
            <span
              className={`inline-block px-1.5 py-0.5 rounded text-[10.5px] font-semibold ${party.active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
            >
              {party.active ? "Actif" : "Désactivé"}
            </span>
          </div>
          <div className="flex gap-4 mt-2 text-[11.5px] text-neutral-500">
            {party.phone && <span>Tél : {party.phone}</span>}
            {party.email && <span>Email : {party.email}</span>}
            {party.address && <span>{party.address}</span>}
          </div>
        </div>

        {canManage && (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              <Pencil size={13} /> Modifier
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleActivation}
              disabled={toggleActivationMutation.isPending}
              className={
                party.active
                  ? "text-red-500 hover:bg-red-50"
                  : "text-emerald-600 hover:bg-emerald-50"
              }
            >
              {toggleActivationMutation.isPending ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Power size={13} />
              )}
              {party.active ? "Désactiver" : "Activer"}
            </Button>
          </div>
        )}
      </div>

      {/* Three balances — never merged, per M3 spec */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white border border-neutral-200 rounded-lg px-4 py-3">
          <p className="text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">
            Créances (dû à l'agence)
          </p>
          {creances.length === 0 ? (
            <>
              <p className="text-[18px] font-bold text-neutral-400 mt-1">0 XAF</p>
              <p className="text-[10px] text-neutral-500">Aucune créance en cours</p>
            </>
          ) : (
            <>
              <p className="text-[18px] font-bold text-red-600 mt-1">
                {creancesTotal.toLocaleString("fr-FR")} XAF
              </p>
              <p className="text-[10px] text-neutral-500">
                {creances.length} échéance{creances.length > 1 ? "s" : ""}
                {overdueCount > 0 && ` · ${overdueCount} en retard`}
              </p>
            </>
          )}
        </div>
        <div className="bg-white border border-neutral-200 rounded-lg px-4 py-3">
          <p className="text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">
            Crédit / Avoir
          </p>
          <p className="text-[18px] font-bold text-brand-gold-dark mt-1">
            {creditBalance?.toLocaleString("fr-FR")} XAF
          </p>
          {openLots.length > 0 && (
            <p className="text-[10px] text-neutral-500">
              {openLots.length} lot{openLots.length > 1 ? "s" : ""} ouvert
              {openLots.length > 1 ? "s" : ""}
            </p>
          )}
        </div>
        <div className="bg-white border border-neutral-200 rounded-lg px-4 py-3">
          <p className="text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">
            Épargne voyage
          </p>
          {savingsAccount ? (
            <>
              <p className="text-[18px] font-bold text-brand-gold-dark mt-1">
                {parseFloat(savingsAccount.balance).toLocaleString("fr-FR")} XAF
              </p>
              <p className="text-[10px] text-neutral-500">
                {savingsAccount.subscriptionSource === "direct" ? "Souscription directe" : "Conversion crédit"}
              </p>
            </>
          ) : (
            <>
              <p className="text-[18px] font-bold text-neutral-400 mt-1">—</p>
              <p className="text-[10px] text-neutral-400">Aucun compte ouvert</p>
            </>
          )}
        </div>
      </div>

      {savingsAccount && (
        <div className="flex justify-end mb-4">
          <SavingsTransactionDialog account={savingsAccount} onRecorded={handleReload} />
        </div>
      )}

      <Tabs defaultValue="credit">
        <TabsList>
          <TabsTrigger value="credit">Lots de crédit</TabsTrigger>
          <TabsTrigger value="commercial">Historique commercial</TabsTrigger>
          <TabsTrigger value="epargne">Historique épargne</TabsTrigger>
        </TabsList>

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
            <p className="text-[12px] text-neutral-500 py-4">Aucun document commercial pour cette partie.</p>
          ) : (
            <div className="space-y-2 py-2">
              {history.commercial.data.map((entry) => (
                <Link
                  key={`${entry.docType}-${entry.id}`}
                  to={entry.docType === "invoice" ? `/invoices/${entry.id}` : `/proformas/${entry.id}`}
                  className="bg-white border border-neutral-200 rounded-lg px-4 py-3 flex items-center justify-between hover:border-brand-gold-dark transition-colors"
                >
                  <div>
                    <p className="text-[12px] font-medium text-neutral-800">
                      {entry.docType === "invoice" ? "Facture" : "Proforma"} {entry.number ?? `#${entry.id}`}
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
                      {NATURE_LABELS[t.nature]} — {parseFloat(t.totalAmount).toLocaleString("fr-FR")} XAF
                      {t.reversalOfTransactionId && (
                        <span className="text-[10.5px] text-amber-600 ml-2">(contre-passation)</span>
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
                      <ReverseSavingsTransactionDialog transactionId={t.id} onReversed={handleReload} />
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
