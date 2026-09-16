"use client";

import {
  Check,
  Clipboard,
  Download,
  FileText,
  Loader2,
  Phone,
  Search,
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import PaginatedTableCard from "@/components/PaginatedTableCard";

export type ApplicationStatus = "pending" | "reviewed" | "rejected";

export type AdminApplication = {
  id: string;
  nom: string;
  prenom: string;
  poste: string;
  telephone: string;
  status: ApplicationStatus;
  created_at: string;
  downloadUrl: string | null;
};

type ApplicationsTableProps = {
  applications: AdminApplication[];
  updateStatus: (formData: FormData) => Promise<void>;
};

const statusOptions: { value: ApplicationStatus; label: string }[] = [
  { value: "pending", label: "En attente" },
  { value: "reviewed", label: "Accepté" },
  { value: "rejected", label: "Refusé" },
];

const statusStyles: Record<ApplicationStatus, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  reviewed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  rejected: "border-rose-200 bg-rose-50 text-rose-800",
};

function getInitials(application: AdminApplication) {
  return `${application.prenom.charAt(0)}${application.nom.charAt(0)}`.toUpperCase();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

export default function ApplicationsTable({
  applications: initialApplications,
  updateStatus,
}: ApplicationsTableProps) {
  const [applications, setApplications] = useState(initialApplications);
  const [query, setQuery] = useState("");
  const [activeStatus, setActiveStatus] = useState<ApplicationStatus | "all">("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const filteredApplications = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return applications.filter((application) => {
      const matchesStatus = activeStatus === "all" || application.status === activeStatus;
      const searchableText = [
        application.prenom,
        application.nom,
        application.poste,
        application.telephone,
      ]
        .join(" ")
        .toLowerCase();
      return matchesStatus && (!normalizedQuery || searchableText.includes(normalizedQuery));
    });
  }, [activeStatus, applications, query]);

  async function handleStatusChange(id: string, status: ApplicationStatus) {
    const previousStatus = applications.find((application) => application.id === id)?.status;
    if (!previousStatus || previousStatus === status) return;

    setApplications((current) =>
      current.map((application) =>
        application.id === id ? { ...application, status } : application,
      ),
    );
    setUpdatingId(id);

    const formData = new FormData();
    formData.set("id", id);
    formData.set("status", status);

    startTransition(async () => {
      try {
        await updateStatus(formData);
        toast.success("Statut mis à jour.");
      } catch (error) {
        setApplications((current) =>
          current.map((application) =>
            application.id === id
              ? { ...application, status: previousStatus }
              : application,
          ),
        );
        toast.error(
          error instanceof Error ? error.message : "Impossible de mettre à jour le statut.",
        );
      } finally {
        setUpdatingId(null);
      }
    });
  }

  async function copyPhone(id: string, phone: string) {
    try {
      await navigator.clipboard.writeText(phone);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1600);
    } catch {
      toast.error("Impossible de copier le numéro.");
    }
  }

  return (
    <div className="mt-10 space-y-4">
      {/* Search & Status Filters Header */}
      <div className="rounded-2xl border border-[#ded8cc] bg-[#fffaf2] p-5 md:p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-md">
            <Search
              size={17}
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#6e6a61]"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher un candidat, un poste…"
              aria-label="Rechercher une candidature"
              className="w-full rounded-full border border-[#ded8cc] bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#a92e27] focus:ring-2 focus:ring-[#a92e27]/10"
            />
          </div>
          <span className="inline-flex w-fit rounded-full bg-[#171717] px-4 py-2 text-xs font-bold uppercase tracking-[.12em] !text-white">
            {filteredApplications.length} Candidature{filteredApplications.length === 1 ? "" : "s"}
          </span>
        </div>
        
        <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Filtrer par statut">
          <button
            type="button"
            role="tab"
            aria-selected={activeStatus === "all"}
            onClick={() => setActiveStatus("all")}
            className={`rounded-full px-4 py-2 text-xs font-bold transition ${activeStatus === "all" ? "bg-[#a92e27] !text-white" : "border border-[#ded8cc] text-[#4a4741] hover:bg-white"}`}
          >
            Tous
          </button>
          {statusOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={activeStatus === option.value}
              onClick={() => setActiveStatus(option.value)}
              className={`rounded-full px-4 py-2 text-xs font-bold transition ${activeStatus === option.value ? "bg-[#a92e27] !text-white" : "border border-[#ded8cc] text-[#4a4741] hover:bg-white"}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Paginated Table Component */}
      <PaginatedTableCard
        title="Liste des Candidatures"
        items={filteredApplications}
        pageSize={10}
        headers={["Date", "Candidat", "Poste", "Téléphone", "Statut", "CV"]}
        renderRow={(application, index) => (
          <tr
            key={application.id ?? index}
            className="border-b border-[#ded8cc] transition-colors last:border-0 hover:bg-neutral-100/50"
          >
            <td className="whitespace-nowrap px-6 py-5 text-xs text-[#6e6a61]">
              {formatDate(application.created_at)}
            </td>
            <td className="px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8c7a5] text-xs font-bold text-[#596246]">
                  {getInitials(application)}
                </span>
                <span className="font-bold text-[#171717]">
                  {application.prenom} {application.nom}
                </span>
              </div>
            </td>
            <td className="px-6 py-5 text-[#4a4741]">{application.poste || "—"}</td>
            <td className="px-6 py-5">
              <div className="flex items-center gap-2 whitespace-nowrap">
                <Phone size={14} aria-hidden="true" className="text-[#596246]" />
                <a href={`tel:${application.telephone}`} className="text-[#4a4741] hover:text-[#a92e27]">
                  {application.telephone}
                </a>
                <button
                  type="button"
                  onClick={() => copyPhone(application.id, application.telephone)}
                  className="rounded-md p-1.5 text-[#6e6a61] transition hover:bg-[#f7f2e8] hover:text-[#171717]"
                  aria-label={`Copier le numéro de ${application.prenom} ${application.nom}`}
                >
                  {copiedId === application.id ? (
                    <Check size={14} aria-hidden="true" />
                  ) : (
                    <Clipboard size={14} aria-hidden="true" />
                  )}
                </button>
              </div>
            </td>
            <td className="px-6 py-5">
              <div className="relative w-fit">
                <select
                  value={application.status}
                  onChange={(event) =>
                    handleStatusChange(application.id, event.target.value as ApplicationStatus)
                  }
                  disabled={updatingId === application.id}
                  aria-label={`Statut de ${application.prenom} ${application.nom}`}
                  className={`appearance-none rounded-full border py-2 pl-3 pr-8 text-xs font-bold outline-none transition focus:ring-2 focus:ring-[#a92e27]/20 disabled:cursor-wait disabled:opacity-60 ${statusStyles[application.status]}`}
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {updatingId === application.id && (
                  <Loader2
                    size={13}
                    className="absolute right-2 top-1/2 -translate-y-1/2 animate-spin"
                    aria-label="Mise à jour"
                  />
                )}
              </div>
            </td>
            <td className="px-6 py-5">
              {application.downloadUrl ? (
                <a
                  href={application.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-[#a92e27]/25 bg-[#a92e27]/5 px-3 py-2 text-xs font-bold text-[#a92e27] transition hover:bg-[#a92e27] hover:!text-white"
                >
                  <FileText size={14} aria-hidden="true" />
                  Voir CV
                  <Download size={13} aria-hidden="true" />
                </a>
              ) : (
                <span className="text-xs text-[#6e6a61]">Indisponible</span>
              )}
            </td>
          </tr>
        )}
      />
    </div>
  );
}