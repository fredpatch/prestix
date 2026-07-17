function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}
function monthStartISO(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
}
function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}
function yearStartISO(): string {
  return new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0];
}

export const PRESETS = [
  { label: "Ce mois", from: monthStartISO(), to: todayISO() },
  { label: "30 derniers jours", from: daysAgoISO(30), to: todayISO() },
  { label: "Cette année", from: yearStartISO(), to: todayISO() },
];
