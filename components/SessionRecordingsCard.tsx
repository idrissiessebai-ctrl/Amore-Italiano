"use client";

import type { SessionRecording } from "@/app/actions/analytics";
import PaginatedTableCard from "@/components/PaginatedTableCard";

function formatDuration(seconds: number) {
  if (!seconds) return "—";
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.round(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remaining}`;
}

function formatDate(value: string | null) {
  if (!value) return "Date inconnue";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

export default function SessionRecordingsCard({
  recordings,
}: {
  recordings: SessionRecording[];
}) {
  return (
    <PaginatedTableCard
      title="Enregistrements récents"
      items={recordings}
      pageSize={5}
      headers={["Emplacement", "Appareil & Date", "Durée", "Action"]}
      renderRow={(recording, index) => (
        <tr key={recording.id ?? index} className="hover:bg-gray-50/50">
          <td className="py-3 font-semibold text-[#1a1a1a]">
            {recording.location || "Inconnu"}
          </td>
          <td className="py-3 text-sm text-[#4a4741]">
            {recording.device} · {formatDate(recording.startTime)}
          </td>
          <td className="py-3">
            <span className="inline-block rounded-full bg-[#596246] px-3 py-1 text-xs font-bold !text-white">
              {formatDuration(recording.duration)}
            </span>
          </td>
          <td className="py-3">
            <a
              href={recording.replayUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-[#a92e27] hover:underline"
            >
              OUVRIR DANS POSTHOG ↗
            </a>
          </td>
        </tr>
      )}
    />
  );
}