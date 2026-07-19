import { useState } from "react";
import { BarChart3 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DashboardFilterBar } from "./dashboard/DashboardFilterBar";
import { PRESETS } from "./dashboard/date-presets";
import { GlobalTab } from "./analyse/GlobalTab";
import { EmployeesTab } from "./analyse/EmployeesTab";
import { usePageHeader } from "@/components/layouts/lib/page-header";

// Structure modeled on SICOT's analytics section (tab-per-domain, shared
// period selector, charts + comparison tables) per Fred's explicit direction.
// Only two tabs built so far — Vue globale and Employés. This section is
// meant to grow: Clients & Référents, Services, Créances & Engagements, and
// Rapports are planned but not yet built, deliberately, rather than shipping
// empty placeholder tabs.
export default function AnalysePage() {
  const [from, setFrom] = useState(PRESETS[0].from);
  const [to, setTo] = useState(PRESETS[0].to);
  const [basis, setBasis] = useState<"accrual" | "cash">("accrual");

  usePageHeader({ title: "Analyse" });

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <BarChart3 size={16} className="text-brand-gold-dark" />
        <p className="text-neutral-500 text-sm">
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
      />

      <Tabs defaultValue="global">
        <TabsList>
          <TabsTrigger value="global">Vue globale</TabsTrigger>
          <TabsTrigger value="employes">Employés</TabsTrigger>
        </TabsList>

        <TabsContent value="global">
          <GlobalTab from={from} to={to} basis={basis} />
        </TabsContent>
        <TabsContent value="employes">
          <EmployeesTab from={from} to={to} basis={basis} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
