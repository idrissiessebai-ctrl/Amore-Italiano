import type { OverviewMetrics } from "@/app/actions/analytics";

function formatDuration(seconds?: number) {
  if (!seconds) return "—";
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.round(seconds % 60);
  return minutes ? `${minutes}m ${remaining}s` : `${remaining}s`;
}

export default function AnalyticsOverviewCards({
  metrics,
}: {
  metrics?: OverviewMetrics;
}) {
  const cards = [
    ["Visiteurs", (metrics?.visitors ?? 0).toLocaleString("fr-FR")],
    ["Pages vues", (metrics?.pageviews ?? 0).toLocaleString("fr-FR")],
    ["Durée moyenne", formatDuration(metrics?.averageSessionDuration)],
    ["Taux de rebond", `${Math.round(metrics?.bounceRate ?? 0)}%`],
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(([label, value]) => (
        <div key={label} className="rounded-xl bg-white p-6 shadow-sm">
          <strong className="serif block text-4xl">{value}</strong>
          <span className="text-sm text-[#4a4741]">{label}</span>
        </div>
      ))}
    </div>
  );
}