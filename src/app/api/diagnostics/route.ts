import { NextResponse } from "next/server";

type StatusLevel = "ok" | "warn" | "error";

interface DiagnosticsResponse {
  timestamp: string;
  env: {
    DATABASE_URL: boolean;
    NEXT_PUBLIC_SUPABASE_URL: boolean;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: boolean;
    OPENAI_API_KEY: boolean;
    NEXT_PUBLIC_APP_URL: boolean;
  };
  database: {
    connected: boolean;
    schemaApplied: boolean;
    error?: string;
  };
  auth: {
    configured: boolean;
    supabaseReachable: boolean | null;
  };
  ai: {
    configured: boolean;
  };
  overallStatus: StatusLevel;
}

export async function GET() {
  const env = {
    DATABASE_URL: Boolean(process.env.DATABASE_URL),
    NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    OPENAI_API_KEY: Boolean(process.env.OPENAI_API_KEY),
    NEXT_PUBLIC_APP_URL: Boolean(process.env.NEXT_PUBLIC_APP_URL),
  } as const;

  // Database checks
  let dbConnected = false;
  let schemaApplied = false;
  let dbError: string | undefined;
  if (env.DATABASE_URL) {
    try {
      const [{ db }, { sql }, schema] = await Promise.all([
        import("@/lib/db"),
        import("drizzle-orm"),
        import("@/lib/schema"),
      ]);
      // Ping DB
      await db.execute(sql`select 1`);
      dbConnected = true;
      try {
        // Touch a known table to verify migrations
        await db.select().from(schema.profiles).limit(1);
        schemaApplied = true;
      } catch {
        schemaApplied = false;
      }
    } catch (err) {
      dbConnected = false;
      dbError = err instanceof Error ? err.message : "Unknown database error";
    }
  } else {
    dbConnected = false;
    schemaApplied = false;
    dbError = "DATABASE_URL is not set";
  }

  // Check Supabase reachability
  let supabaseReachable: boolean | null = null;
  if (env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/health`, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      supabaseReachable = res.status === 200;
    } catch {
      supabaseReachable = false;
    }
  }

  const authConfigured =
    env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const aiConfigured = env.OPENAI_API_KEY; // We avoid live-calling the AI provider here

  const overallStatus: StatusLevel = (() => {
    if (!env.DATABASE_URL || !dbConnected || !schemaApplied) return "error";
    if (!authConfigured) return "error";
    // AI is optional; warn if not configured
    if (!aiConfigured) return "warn";
    return "ok";
  })();

  const body: DiagnosticsResponse = {
    timestamp: new Date().toISOString(),
    env,
    database: {
      connected: dbConnected,
      schemaApplied,
      error: dbError,
    },
    auth: {
      configured: authConfigured,
      supabaseReachable: supabaseReachable,
    },
    ai: {
      configured: aiConfigured,
    },
    overallStatus,
  };

  return NextResponse.json(body, {
    status: 200,
  });
}