import type { Metadata } from "next";
import Link from "next/link";
import {
  getOverviewMetrics,
  getRecentVisitors,
  getSessionRecordings,
  getTopPages,
} from "@/app/actions/analytics";
import AnalyticsOverviewCards from "@/components/AnalyticsOverviewCards";
import SessionRecordingsCard from "@/components/SessionRecordingsCard";
import TopPagesTable from "@/components/TopPagesTable";
import VisitorsListTable from "@/components/VisitorsListTable";
import { assertAdmin } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await assertAdmin();

  const [counts, overview, visitors, recordings, topPages] = await Promise.all([
    Promise.all([
      supabase.from("applications").select("id", { count: "exact", head: true }),
      supabase.from("menu_items").select("id", { count: "exact", head: true }),
    ]),
    getOverviewMetrics(),
    getRecentVisitors(),
    getSessionRecordings(),
    getTopPages(),
  ]);

  const warnings = [overview, visitors, recordings, topPages]
    .map((result) => result.warning)
    .filter((warning, index, all): warning is string => Boolean(warning) && all.indexOf(warning) === index);

  console.log({ overview, visitors, recordings, topPages })
  return (
    <section className="mx-auto w-[92%] max-w-[1180px] py-16">
      <p className="text-xs font-bold uppercase tracking-[.2em] text-[#a92e27]">
        Administration
      </p>
      <h1 className="serif mt-3 text-6xl">Dashboard.</h1>

      {warnings.length > 0 && (
        <div className="mt-8 rounded-xl border border-[#e8c7a5] bg-[#fffaf2] p-4 text-sm text-[#4a4741]" role="status">
          <strong>Analytics indisponibles :</strong> {warnings[0]}
        </div>
      )}

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <Link href="/admin/applications" className="rounded-xl bg-white p-7 shadow-sm">
          <strong className="serif block text-4xl">{counts[0].count ?? 0}</strong>
          <span>Candidatures reçues</span>
        </Link>
        <Link href="/admin/menu" className="rounded-xl bg-white p-7 shadow-sm">
          <strong className="serif block text-4xl">{counts[1].count ?? 0}</strong>
          <span>Éléments du menu</span>
        </Link>
      </div>

      <div className="mt-10 space-y-6">
        <AnalyticsOverviewCards metrics={overview.data} />
        <div className="grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
          <VisitorsListTable visitors={visitors.data} />
          <TopPagesTable pages={topPages.data} />
        </div>
        <SessionRecordingsCard recordings={recordings.data} />
      </div>
    </section>
  );
}
