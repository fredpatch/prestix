import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, AlertTriangle } from "lucide-react";
import {
  reportingApi,
  type CreanceByParty,
  type AccrualVsCashComparison,
  type OpenEngagements,
} from "@/lib/reporting.api";
import { ChartCanvas, CHART_COLORS } from "@/components/analytics/ChartCanvas";

interface CreancesEngagementsTabProps {
  from: string;
  to: string;
}

function fmt(n: number): string {
  return n.toLocaleString("fr-FR");
}

export function CreancesEngagementsTab({ from, to }: CreancesEngagementsTabProps) {
  const [creances, setCreances] = useState<CreanceByParty[]>([]);
  const [comparison, setComparison] = useState<AccrualVsCashComparison | null>(null);
  const [engagements, setEngagements] = useState<OpenEngagements | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      reportingApi.getCreancesByParty(),
      reportingApi.getAccrualVsCashComparison({ from, to }),
      reportingApi.getOpenEngagements(),
    ]).then(([creancesRes, comparisonRes, engagementsRes]) => {
      setCreances(creancesRes.data);
      setComparison(comparisonRes.data);
      setEngagements(engagementsRes.data);
      setLoading(false);
    });
  }, [from, to]);

  if (loading || !comparison || !engagements) {
    return (
      <div className="text-center py-16 text-neutral-400">
        <Loader2 size={18} className="animate-spin inline mr-2" /> Chargement...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Engagement vs Encaissement shown SIDE BY SIDE — deliberately not the
          toggle used everywhere else, per Lucrèce's own framing: "combien on
          gagne" vs "combien on gagne réellement" are two different questions
          worth seeing at once, not one you switch between. */}
      <div className="bg-white border border-neutral-200 rounded-lg p-4">
        <p className="text-[11.5px] font-semibold text-neutral-800 mb-0.5">
          Ce qu'on gagne vs. ce qu'on encaisse réellement
        </p>
        <p className="text-[10.5px] text-neutral-500 mb-3">
          Engagement (facturé) et Encaissement (payé) pour la même période, côte à côte.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-neutral-200 rounded-lg p-3">
            <p className="text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">Engagement</p>
            <p className="text-[18px] font-bold text-neutral-800 mt-1">{fmt(comparison.accrual.totalGross)} XAF</p>
            <p className="text-[10px] text-neutral-500">CA brut facturé</p>
            <p className="text-[13px] font-semibold text-brand-gold-dark mt-1">
              {fmt(comparison.accrual.totalGain)} XAF <span className="text-[10px] font-normal text-neutral-500">gain</span>
            </p>
          </div>
          <div className="border border-neutral-200 rounded-lg p-3">
            <p className="text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">Encaissement</p>
            <p className="text-[18px] font-bold text-emerald-700 mt-1">{fmt(comparison.cash.totalGross)} XAF</p>
            <p className="text-[10px] text-neutral-500">Argent réellement reçu</p>
            <p className="text-[13px] font-semibold text-emerald-700 mt-1">
              {fmt(comparison.cash.totalGain)} XAF <span className="text-[10px] font-normal text-neutral-500">gain</span>
            </p>
          </div>
        </div>
        {comparison.accrual.totalGross > comparison.cash.totalGross && (
          <p className="text-[10.5px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2.5 py-1.5 mt-3">
            L'écart entre les deux ({fmt(comparison.accrual.totalGross - comparison.cash.totalGross)} XAF)
            représente ce qui est facturé mais pas encore encaissé.
          </p>
        )}
      </div>

      {/* Engagements non clôturés */}
      <div className="bg-white border border-neutral-200 rounded-lg p-4">
        <p className="text-[11.5px] font-semibold text-neutral-800 mb-0.5">Engagements non clôturés</p>
        <p className="text-[10.5px] text-neutral-500 mb-3">
          Affaires pas encore commises — indépendant de la période sélectionnée.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-neutral-200 rounded-lg p-3">
            <p className="text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">
              Factures en brouillon
            </p>
            <p className="text-[18px] font-bold text-neutral-800 mt-1">{engagements.draftInvoiceCount}</p>
            <p className="text-[10px] text-neutral-500">{fmt(engagements.draftInvoiceValue)} XAF potentiel</p>
          </div>
          <div className="border border-neutral-200 rounded-lg p-3">
            <p className="text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">
              Proformas ouverts
            </p>
            <p className="text-[18px] font-bold text-neutral-800 mt-1">{engagements.openProformaCount}</p>
            <p className="text-[10px] text-neutral-500">{fmt(engagements.openProformaValue)} XAF potentiel</p>
          </div>
        </div>
      </div>

      {/* Qui doit — comparaison par partie */}
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 border-b border-neutral-200">
          <p className="text-[11.5px] font-semibold text-neutral-800">Qui doit — créances par partie</p>
          <p className="text-[10.5px] text-neutral-500">
            Toutes créances non réglées, indépendant de la période — situation actuelle.
          </p>
        </div>
        {creances.length === 0 ? (
          <p className="px-4 py-8 text-center text-[11.5px] text-neutral-500">Aucune créance en cours.</p>
        ) : (
          <>
            <div className="p-4 border-b border-neutral-200">
              <ChartCanvas
                label="Créances par partie"
                height={Math.max(180, Math.min(creances.length, 10) * 34)}
                config={{
                  type: "bar",
                  data: {
                    labels: creances.slice(0, 10).map((c) => c.partyName),
                    datasets: [
                      {
                        label: "Montant dû (XAF)",
                        data: creances.slice(0, 10).map((c) => c.totalDue),
                        backgroundColor: CHART_COLORS.danger,
                        borderRadius: 4,
                      },
                    ],
                  },
                  options: {
                    indexAxis: "y",
                    plugins: { legend: { display: false } },
                    scales: {
                      x: { ticks: { font: { size: 11 }, color: CHART_COLORS.muted }, grid: { color: CHART_COLORS.grid }, beginAtZero: true },
                      y: { ticks: { font: { size: 11 }, color: CHART_COLORS.muted }, grid: { display: false } },
                    },
                  },
                }}
              />
            </div>
            <table className="w-full text-left">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-4 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">
                    Partie
                  </th>
                  <th className="px-4 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500 text-right">
                    Principal dû
                  </th>
                  <th className="px-4 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500 text-right">
                    Pénalités dues
                  </th>
                  <th className="px-4 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500 text-right">
                    Total dû
                  </th>
                  <th className="px-4 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500"></th>
                </tr>
              </thead>
              <tbody>
                {creances.map((c) => (
                  <tr key={c.partyId} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                    <td className="px-4 py-2 text-[12px] text-neutral-800">
                      <Link to={`/parties/${c.partyId}`} className="hover:text-brand-gold-dark hover:underline">
                        {c.partyName}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-[12px] text-neutral-500 text-right">{fmt(c.principalDue)}</td>
                    <td className="px-4 py-2 text-[12px] text-neutral-500 text-right">{fmt(c.penaltyDue)}</td>
                    <td className="px-4 py-2 text-[12px] font-medium text-neutral-800 text-right">{fmt(c.totalDue)}</td>
                    <td className="px-4 py-2 text-right">
                      {c.overdueCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-red-600">
                          <AlertTriangle size={10} /> {c.overdueCount} en retard
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}
