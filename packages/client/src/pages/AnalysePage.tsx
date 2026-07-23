import { useState } from "react";
import { BarChart3 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DashboardFilterBar } from "./dashboard/DashboardFilterBar";
import { PRESETS } from "./dashboard/date-presets";
import { GlobalTab } from "./analyse/GlobalTab";
import { EmployeesTab } from "./analyse/EmployeesTab";
import { ClientsReferrersTab } from "./analyse/ClientsReferrersTab";
import { ServicesTab } from "./analyse/ServicesTab";
import { CreancesEngagementsTab } from "./analyse/CreancesEngagementsTab";
import { usePageHeader } from "@/components/layouts/lib/page-header";
import { RapportsTab } from "./analyse/RapportsTab";

// Structure modeled on SICOT's analytics section (tab-per-domain, shared
// period selector, charts + comparison tables) per Fred's explicit direction.
// All six planned tabs now built — Vue globale, Employés, Clients &
// Référents, Services, Créances & Engagements, Rapports. Report history and
// automatic periodic generation (SICOT has both) are explicitly NOT built —
// noted directly in the Rapports tab, not silently skipped.
//
// Export buttons removed from the shared filter bar here (showExports=false)
// — they used to export a fixed dashboard-shaped report regardless of which
// tab was open, which is exactly the mismatch Fred flagged. Real exports
// with module selection now live in the Rapports tab.
export default function AnalysePage() {
  const [from, setFrom] = useState(PRESETS[0].from);
  const [to, setTo] = useState(PRESETS[0].to);
  const [basis, setBasis] = useState<"accrual" | "cash">("accrual");

  usePageHeader({
    title: "Analyse",
    helpTopic: "dashboard",
    guide: {
      steps: [
        "Six onglets, un par domaine d'analyse.",
        "Les filtres de période sont partagés entre les onglets.",
        "Export PDF/Excel disponible depuis l'onglet Rapports.",
      ],
    },
  });

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <BarChart3 size={16} className="text-brand-gold-dark" />
        <p className="text-muted-foreground text-sm">
          Analyse détaillée pour la prise de décision — évolution, comparaison, tendances.
        </p>
      </div>

      <DashboardFilterBar
        from={from}
        to={to}
        basis={basis}
        onFromChange={setFrom}
        onToChange={setTo}
        onBasisChange={setBasis}
        showExports={false}
      />

      <Tabs defaultValue="global">
        <TabsList>
          <TabsTrigger value="global">Vue globale</TabsTrigger>
          <TabsTrigger value="employes">Employés</TabsTrigger>
          <TabsTrigger value="clients-referents">Clients & Référents</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="creances">Créances & Engagements</TabsTrigger>
          <TabsTrigger value="rapports">Rapports</TabsTrigger>
        </TabsList>

        <TabsContent value="global">
          <GlobalTab from={from} to={to} basis={basis} />
        </TabsContent>
        <TabsContent value="employes">
          <EmployeesTab from={from} to={to} basis={basis} />
        </TabsContent>
        <TabsContent value="clients-referents">
          <ClientsReferrersTab from={from} to={to} basis={basis} />
        </TabsContent>
        <TabsContent value="services">
          <ServicesTab from={from} to={to} basis={basis} />
        </TabsContent>
        <TabsContent value="creances">
          <CreancesEngagementsTab from={from} to={to} />
        </TabsContent>
        <TabsContent value="rapports">
          <RapportsTab from={from} to={to} basis={basis} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
