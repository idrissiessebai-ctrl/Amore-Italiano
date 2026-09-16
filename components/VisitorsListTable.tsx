"use client"
import type { VisitorProfile } from "@/app/actions/analytics";
import PaginatedTableCard from "./PaginatedTableCard";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function VisitorsListTable({ visitors }: { visitors: VisitorProfile[] }) {
  return (
    <PaginatedTableCard
      title="Derniers Visiteurs"
      items={visitors}
      pageSize={10}
      headers={["Pays", "Navigateur", "Appareil", "Dernière visite"]}
      renderRow={(visitor, index) => (
        <tr key={visitor.id ?? index} className="hover:bg-gray-50/50">
          <td className="py-3 font-medium">{visitor.country}</td>
          <td className="py-3">{visitor.browser}</td>
          <td className="py-3">{visitor.device}</td>
          <td className="py-3 text-xs text-gray-400">
            {visitor.lastSeenAt ? new Date(visitor.lastSeenAt).toLocaleString("fr-FR") : "—"}
          </td>
        </tr>
      )}
    />
  );
}
