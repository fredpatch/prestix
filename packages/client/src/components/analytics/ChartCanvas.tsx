import { useEffect, useRef } from "react";
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  LineController,
  BarController,
  DoughnutController,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartConfiguration,
  type ChartType,
} from "chart.js";

// Chart.js v4 requires TWO separate registrations per chart type: the visual
// building blocks (LineElement, BarElement, ArcElement — how a point/bar/arc
// gets drawn) AND the controller (LineController, BarController,
// DoughnutController — how a dataset maps to those visual elements). The
// first pass only registered the former, which is why "line" showed up as
// "not a registered controller" — the elements existed, the controller that
// actually assembles them into a line chart didn't.
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  LineController,
  BarController,
  DoughnutController,
  Title,
  Tooltip,
  Legend,
  Filler,
);

// Shared palette — matches the brand-gold used across every printed document
// and the dashboard's own accent color, not SICOT's navy scheme.
export const CHART_COLORS = {
  primary: "#a77800", // brand-gold-dark
  success: "#1a7a4c",
  warning: "#b8860b",
  danger: "#b03a2e",
  muted: "#8a8a8a",
  grid: "#e5e0d5",
};

interface ChartCanvasProps<TType extends ChartType = ChartType> {
  config: ChartConfiguration<TType>;
  height?: number;
  label: string; // accessibility label, not a visible title
}

export function ChartCanvas<TType extends ChartType = ChartType>({
  config,
  height = 240,
  label,
}: ChartCanvasProps<TType>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart<TType> | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Explicitly nulling the ref after destroy, not just calling destroy() —
    // under React StrictMode, effects run mount→cleanup→mount in dev, and a
    // stale (destroyed but still-referenced) instance was causing "Canvas is
    // already in use" when the second mount tried to reuse the same canvas
    // element before the ref was properly cleared.
    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    chartRef.current = new Chart(canvasRef.current, {
      ...config,
      options: { responsive: true, maintainAspectRatio: false, ...config.options },
    } as ChartConfiguration) as Chart<TType>;

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [config]);

  return (
    <div style={{ position: "relative", width: "100%", height: `${height}px` }}>
      <canvas ref={canvasRef} role="img" aria-label={label} />
    </div>
  );
}
