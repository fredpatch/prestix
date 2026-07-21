export interface ChartSeries {
  label: string;
  color: string;
  values: number[];
}

export interface ChartInput {
  title: string;
  labels: string[];
  series: ChartSeries[];
  width?: number;
  height?: number;
}

const GRID = "#e5e7eb";
const TEXT = "#525252";
const TITLE = "#171717";

function esc(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function fmt(value: number): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value);
}

function maxValue(series: ChartSeries[]): number {
  return Math.max(1, ...series.flatMap((s) => s.values));
}

function bucketLabel(bucket: string): string {
  if (/^\d{4}-\d{2}$/.test(bucket)) {
    return new Intl.DateTimeFormat("fr-FR", { month: "short", year: "2-digit" }).format(
      new Date(`${bucket}-01T00:00:00Z`),
    );
  }
  return bucket;
}

export function formatChartBucket(bucket: string): string {
  return bucketLabel(bucket);
}

export function renderLineChartSvg({
  title,
  labels,
  series,
  width = 680,
  height = 280,
}: ChartInput): string {
  if (labels.length === 0 || series.length === 0) {
    return renderEmptyChartSvg(title, width, height);
  }

  const left = 64;
  const right = 18;
  const top = 42;
  const bottom = 58;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const max = maxValue(series);
  const stepX = labels.length > 1 ? plotWidth / (labels.length - 1) : 0;
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  const grid = ticks
    .map((ratio) => {
      const y = top + plotHeight - ratio * plotHeight;
      return `
        <line x1="${left}" y1="${y}" x2="${width - right}" y2="${y}" stroke="${GRID}" stroke-width="1" />
        <text x="${left - 10}" y="${y + 4}" text-anchor="end" font-size="10" fill="${TEXT}">${fmt(max * ratio)}</text>`;
    })
    .join("");

  const lines = series
    .map((s) => {
      const points = s.values
        .map((value, index) => {
          const x = left + index * stepX;
          const y = top + plotHeight - (value / max) * plotHeight;
          return `${x},${y}`;
        })
        .join(" ");
      const dots = s.values
        .map((value, index) => {
          const x = left + index * stepX;
          const y = top + plotHeight - (value / max) * plotHeight;
          return `<circle cx="${x}" cy="${y}" r="2.2" fill="${s.color}" />`;
        })
        .join("");
      return `<polyline points="${points}" fill="none" stroke="${s.color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />${dots}`;
    })
    .join("");

  const xLabels = labels
    .map((label, index) => {
      const x = left + index * stepX;
      return `<text x="${x}" y="${height - 36}" text-anchor="middle" font-size="10" fill="${TEXT}">${esc(label)}</text>`;
    })
    .join("");

  return wrapChartSvg({
    title,
    width,
    height,
    body: `
      ${grid}
      <line x1="${left}" y1="${top + plotHeight}" x2="${width - right}" y2="${top + plotHeight}" stroke="#d4d4d4" />
      ${lines}
      ${xLabels}
      ${renderLegend(series, left, height - 18)}`,
  });
}

export function renderGroupedBarChartSvg({
  title,
  labels,
  series,
  width = 680,
  height = 280,
}: ChartInput): string {
  if (labels.length === 0 || series.length === 0) {
    return renderEmptyChartSvg(title, width, height);
  }

  const left = 64;
  const right = 18;
  const top = 42;
  const bottom = 58;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const max = maxValue(series);
  const groupWidth = plotWidth / Math.max(labels.length, 1);
  const barWidth = Math.max(5, Math.min(18, (groupWidth - 10) / series.length));
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  const grid = ticks
    .map((ratio) => {
      const y = top + plotHeight - ratio * plotHeight;
      return `
        <line x1="${left}" y1="${y}" x2="${width - right}" y2="${y}" stroke="${GRID}" stroke-width="1" />
        <text x="${left - 10}" y="${y + 4}" text-anchor="end" font-size="10" fill="${TEXT}">${fmt(max * ratio)}</text>`;
    })
    .join("");

  const bars = labels
    .map((_, labelIndex) => {
      const groupStart = left + labelIndex * groupWidth + (groupWidth - barWidth * series.length) / 2;
      return series
        .map((s, seriesIndex) => {
          const value = s.values[labelIndex] ?? 0;
          const h = (value / max) * plotHeight;
          const x = groupStart + seriesIndex * barWidth;
          const y = top + plotHeight - h;
          return `<rect x="${x}" y="${y}" width="${barWidth - 1}" height="${h}" fill="${s.color}" rx="2" />`;
        })
        .join("");
    })
    .join("");

  const xLabels = labels
    .map((label, index) => {
      const x = left + index * groupWidth + groupWidth / 2;
      return `<text x="${x}" y="${height - 36}" text-anchor="middle" font-size="10" fill="${TEXT}">${esc(label)}</text>`;
    })
    .join("");

  return wrapChartSvg({
    title,
    width,
    height,
    body: `
      ${grid}
      <line x1="${left}" y1="${top + plotHeight}" x2="${width - right}" y2="${top + plotHeight}" stroke="#d4d4d4" />
      ${bars}
      ${xLabels}
      ${renderLegend(series, left, height - 18)}`,
  });
}

function renderLegend(series: ChartSeries[], x: number, y: number): string {
  return series
    .map((s, index) => {
      const itemX = x + index * 112;
      return `
        <rect x="${itemX}" y="${y - 8}" width="9" height="9" fill="${s.color}" rx="1" />
        <text x="${itemX + 14}" y="${y}" font-size="10" fill="${TEXT}">${esc(s.label)}</text>`;
    })
    .join("");
}

function renderEmptyChartSvg(title: string, width: number, height: number): string {
  return wrapChartSvg({
    title,
    width,
    height,
    body: `<text x="${width / 2}" y="${height / 2}" text-anchor="middle" font-size="12" fill="${TEXT}">Aucune donnee sur la periode.</text>`,
  });
}

function wrapChartSvg({
  title,
  width,
  height,
  body,
}: {
  title: string;
  width: number;
  height: number;
  body: string;
}): string {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${esc(title)}">
      <rect width="${width}" height="${height}" fill="#ffffff" />
      <text x="16" y="24" font-size="13" font-weight="700" fill="${TITLE}">${esc(title)}</text>
      ${body}
    </svg>`;
}
