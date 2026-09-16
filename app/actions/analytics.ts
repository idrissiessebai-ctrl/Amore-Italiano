"use server";

import { assertAdmin } from "@/lib/auth";

const WINDOW = "30 DAY";

type ApiPayload<T> = {
  results?: T[];
  next?: string | null;
};

export type AnalyticsResult<T> = {
  data: T;
  warning?: string;
};

export type OverviewMetrics = {
  visitors: number;
  pageviews: number;
  averageSessionDuration: number;
  bounceRate: number;
};

export type VisitorProfile = {
  id: string;
  distinctId?: string;
  country: string;
  browser: string;
  device: string;
  lastSeenAt: string | null;
};

export type SessionRecording = {
  id: string;
  duration: number;
  startTime: string | null;
  location: string;
  device: string;
  replayUrl: string;
};

export type TopPage = {
  path: string;
  views: number;
};

export type AnalyticsStats = OverviewMetrics & {
  formStarted: number;
  formSubmitted: number;
  conversionRate: number;
  unavailable?: boolean;
};

function getConfig() {
  const host = (
    process.env.NEXT_PUBLIC_POSTHOG_HOST ||
    process.env.PUBLIC_POSTHOG_HOST ||
    process.env.POSTHOG_API_HOST ||
    "https://eu.posthog.com"
  ).replace(/\/$/, "");

  return {
    apiKey: process.env.POSTHOG_PERSONAL_API_KEY,
    projectId:
      process.env.NEXT_PUBLIC_POSTHOG_PROJECT_ID ||
      process.env.PUBLIC_POSTHOG_PROJECT_ID ||
      process.env.POSTHOG_PROJECT_ID,
    host,
  };
}

function unavailable<T>(data: T): AnalyticsResult<T> {
  return {
    data,
    warning:
      "PostHog analytics are not configured. Add POSTHOG_PERSONAL_API_KEY and NEXT_PUBLIC_POSTHOG_PROJECT_ID.",
  };
}

async function posthogFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { apiKey, projectId, host } = getConfig();
  if (!apiKey || !projectId || !host) {
    const error = new Error(
      "PostHog configuration is missing. Set the API key, project ID, and host.",
    );
    console.error("[PostHog] Missing API key or project ID:", error.message);
    throw error;
  }

  const response = await fetch(`${host}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text();
    console.error(
      `[PostHog] Request failed with ${response.status} ${response.statusText}: ${message}`,
    );
    throw new Error(`PostHog request failed with ${response.status}.`);
  }

  return response.json() as Promise<T>;
}

async function runHogQL<T>(query: string): Promise<T[]> {
  const { projectId } = getConfig();
  const payload = await posthogFetch<ApiPayload<T>>(`/api/projects/${projectId}/query/`, {
    method: "POST",
    body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
  });
  return payload.results ?? [];
}

export async function getOverviewMetrics(): Promise<AnalyticsResult<OverviewMetrics>> {
  await assertAdmin();
  const empty: OverviewMetrics = {
    visitors: 0,
    pageviews: 0,
    averageSessionDuration: 0,
    bounceRate: 0,
  };

  try {
    const [result] = await runHogQL<[number, number, number, number,]>(`
      WITH session_stats AS (
        SELECT
          properties.$session_id AS session_id,
          any(distinct_id) AS distinct_id,
          countIf(event = '$pageview') AS pvs,
          count() AS total_events,
          dateDiff('second', min(timestamp), max(timestamp)) AS duration
        FROM events
        WHERE timestamp >= now() - INTERVAL ${WINDOW}
          AND properties.$session_id IS NOT NULL
        GROUP BY session_id
      )
      SELECT
        count(DISTINCT distinct_id) AS visitors,
        sum(pvs) AS pageviews,
        coalesce(round(avgIf(duration, total_events > 1)), 0) AS average_session_duration,
        coalesce(round(avg(if(total_events <= 1, 1, 0)) * 100), 0) AS bounce_rate
      FROM session_stats
    `);

    if (!result) return unavailable(empty);

    const [visitors, pageviews, averageSessionDuration, bounceRate] = result;

    return {
      data: {
        visitors: Number(visitors) || 0,
        pageviews: Number(pageviews) || 0,
        averageSessionDuration: Number(averageSessionDuration) || 0,
        bounceRate: Number(bounceRate) || 0,
      },
    };
  } catch (error) {
    console.error("[PostHog] Overview metrics request failed:", error);
    return unavailable(empty);
  }
}

function property(properties: Record<string, unknown> | undefined, keys: string[]) {
  for (const key of keys) {
    const value = properties?.[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return "—";
}

export async function getRecentVisitors(): Promise<AnalyticsResult<VisitorProfile[]>> {
  await assertAdmin();
  try {
    const rows = await runHogQL<[string, string, string, string, string]>(`
      SELECT
        distinct_id,
        any(coalesce(properties.$geoip_country_name, properties.$initial_geoip_country_name, '—')) AS country,
        any(coalesce(properties.$browser, properties.$initial_browser, '—')) AS browser,
        any(coalesce(properties.$device_type, properties.$os, properties.$initial_os, '—')) AS device,
        max(timestamp) AS last_seen
      FROM events
      WHERE timestamp >= now() - INTERVAL ${WINDOW}
      GROUP BY distinct_id
      ORDER BY last_seen DESC
      LIMIT 10
    `);

    console.log("DEBUG VISITORS ROWS:", rows);
    
    return {
      data: rows.map(([distinctId, country, browser, device, lastSeen]) => ({
        id: distinctId,
        distinctId,
        country: country || "—",
        browser: browser || "—",
        device: device || "—",
        lastSeenAt: lastSeen || null,
      })),
    };
  } catch (error) {
    console.error("[PostHog] Recent visitors request failed:", error);
    return unavailable([]);
  }
}

type RecordingApiRecord = {
  id: string;
  recording_duration?: number;
  duration?: number;
  start_time?: string | null;
  distinct_id?: string;
  person?: { properties?: Record<string, unknown> };
  properties?: Record<string, unknown>;
};

export async function getSessionRecordings(): Promise<AnalyticsResult<SessionRecording[]>> {
  await assertAdmin();
  try {
    const { projectId, host } = getConfig();
    const payload = await posthogFetch<ApiPayload<RecordingApiRecord>>(
      `/api/projects/${projectId}/session_recordings/?limit=10`,
    );

    const recordings = (payload.results ?? []).map((recording) => {
      const properties = recording.person?.properties ?? recording.properties ?? {};

      const rawLocation = property(properties, [
        "$geoip_city_name",
        "$geoip_country_name",
        "$initial_geoip_city_name",
        "$initial_geoip_country_name",
      ]);

      const location =
        rawLocation !== "—"
          ? rawLocation
          : `Visiteur (${recording.distinct_id?.slice(0, 8) || "Anonyme"})`;

      const rawDevice = property(properties, [
        "$device_type",
        "$browser",
        "$os",
        "$initial_browser",
        "$initial_os",
      ]);
      const device = rawDevice !== "—" ? rawDevice : "Session Web";

      return {
        id: recording.id,
        duration: Number(recording.duration ?? recording.recording_duration) || 0,
        startTime: recording.start_time ?? null,
        location,
        device,
        replayUrl: `${host}/project/${projectId}/replay/${recording.id}`,
      };
    });

    recordings.sort((a, b) =>
      (b.startTime ?? "").localeCompare(a.startTime ?? ""),
    );

    return {
      data: recordings,
    };
  } catch (error) {
    console.error("[PostHog] Session recordings request failed:", error);
    return unavailable([]);
  }
}

export async function getTopPages(): Promise<AnalyticsResult<TopPage[]>> {
  await assertAdmin();
  try {
    const rows = await runHogQL<[string, number]>(`
      SELECT
        coalesce(nullIf(properties.$pathname, ''), nullIf(properties.$current_url, ''), '/') AS path,
        count() AS views
      FROM events
      WHERE event = '$pageview'
        AND timestamp >= now() - INTERVAL ${WINDOW}
      GROUP BY path
      ORDER BY views DESC
      LIMIT 10
    `);

    return {
      data: rows.map(([path, views]) => ({
        path: path || "/",
        views: Number(views) || 0,
      })),
    };
  } catch (error) {
    console.error("[PostHog] Top pages request failed:", error);
    return unavailable([]);
  }
}

export async function getAnalyticsStats(): Promise<AnalyticsStats> {
  const [overview, conversion] = await Promise.all([
    getOverviewMetrics(),
    runConversionQuery(),
  ]);

  return {
    ...overview.data,
    ...conversion.data,
    unavailable: Boolean(overview.warning || conversion.warning),
  };
}

async function runConversionQuery(): Promise<AnalyticsResult<Pick<AnalyticsStats, "formStarted" | "formSubmitted" | "conversionRate">>> {
  await assertAdmin();
  const empty = { formStarted: 0, formSubmitted: 0, conversionRate: 0 };

  try {
    const [result] = await runHogQL<{
      form_started: number;
      form_submitted: number;
    }>(`
      SELECT
        countIf(event = 'work_form_started') AS form_started,
        countIf(event = 'work_form_submitted') AS form_submitted
      FROM events
      WHERE timestamp >= now() - INTERVAL ${WINDOW}
    `);
    if (!result) return unavailable(empty);

    const formStarted = Number(result.form_started) || 0;
    const formSubmitted = Number(result.form_submitted) || 0;
    return {
      data: {
        formStarted,
        formSubmitted,
        conversionRate: formStarted
          ? Math.round((formSubmitted / formStarted) * 100)
          : 0,
      },
    };
  } catch (error) {
    console.error("[PostHog] Conversion metrics request failed:", error);
    return unavailable(empty);
  }
}