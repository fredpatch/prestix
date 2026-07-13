import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2, Power, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { partyApi, type Party, type PartyHistory } from "@/lib/party.api";
import { creditApi, type CreditLot } from "@/lib/credit.api";
import { useAuth } from "@/App";

export default function PartyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const partyId = parseInt(id!);
  const { user } = useAuth();

  const [party, setParty] = useState<Party | null>(null);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [creditLots, setCreditLots] = useState<CreditLot[]>([]);
  const [history, setHistory] = useState<PartyHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      partyApi.getById(partyId),
      creditApi.getBalance(partyId),
      creditApi.listLots(partyId),
      partyApi.getHistory(partyId),
    ]).then(([partyRes, balanceRes, lotsRes, historyRes]) => {
      setParty(partyRes.data);
      setCreditBalance(balanceRes.data.balance);
      setCreditLots(lotsRes.data);
      setHistory(historyRes.data);
      setLoading(false);
    });
  }, [partyId]);

  useEffect(load, [load]);

  async function handleToggleActivation() {
    if (!party) return;
    setActionLoading(true);
    try {
      await partyApi.toggleActivation(party.id, !party.active);
      load();
    } finally {
      setActionLoading(false);
    }
  }

  if (loading || !party) {
    return <Loader2 className="animate-spin text-neutral-400" size={18} />;
  }

  const canManage = user && ["manager", "admin", "super_admin"].includes(user.role);
  const openLots = creditLots.filter((l) => !l.convertedAt && parseFloat(l.remainingAmount) > 0);

  return (
    <div>
      <Link
        to="/parties"
        className="inline-flex items-center gap-1.5 text-[12px] text-neutral-500 hover:text-brand-gold-dark mb-4"
      >
        <ArrowLeft size={13} /> Retour aux parties
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-brand-gold-dark">{party.fullName}</h1>
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
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleActivation}
            disabled={actionLoading}
            className={
              party.active ? "text-red-500 hover:bg-red-50" : "text-emerald-600 hover:bg-emerald-50"
            }
          >
            {actionLoading ? <Loader2 size={13} className="animate-spin" /> : <Power size={13} />}
            {party.active ? "Désactiver" : "Activer"}
          </Button>
        )}
      </div>

      {/* Three balances — never merged, per M3 spec */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white border border-neutral-200 rounded-lg px-4 py-3">
          <p className="text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">
            Créances (dû à l'agence)
          </p>
          <p className="text-[18px] font-bold text-neutral-400 mt-1">—</p>
          <p className="text-[10px] text-neutral-400">
            Disponible avec le module Documents (Sprint 3)
          </p>
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
          <p className="text-[18px] font-bold text-neutral-400 mt-1">—</p>
          <p className="text-[10px] text-neutral-400">
            Disponible avec le module Épargne (Sprint 9)
          </p>
        </div>
      </div>

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
          <p className="text-[12px] text-neutral-500 py-4">
            {history?.commercial.total === 0
              ? "Aucun historique commercial — disponible une fois le module Documents (Sprint 3) en place."
              : `${history?.commercial.total} document(s)`}
          </p>
        </TabsContent>

        <TabsContent value="epargne">
          <p className="text-[12px] text-neutral-500 py-4">
            {history?.epargne.total === 0
              ? "Aucun historique épargne — disponible une fois le module Épargne (Sprint 9) en place."
              : `${history?.epargne.total} mouvement(s)`}
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
