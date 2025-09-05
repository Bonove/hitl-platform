import { createClient } from "@/utils/supabase/server"
import { Database } from "@/types/supabase"
import { NextRequest, NextResponse } from "next/server"
import { validateApiKey, unauthorizedResponse, getApiKeyFingerprint } from "@/utils/auth/api-auth"

type CaseStatus = Database["public"]["Enums"]["case_status"]

export async function POST(request: NextRequest) {
  // Validate API key for MCP House requests
  const authHeader = request.headers.get("authorization")
  if (authHeader && authHeader.startsWith("Bearer ")) {
    // This is an API request, validate the key
    if (!validateApiKey(request)) {
      console.log(`API auth failed from: ${getApiKeyFingerprint(request) || 'no-key'}`)
      return unauthorizedResponse("Invalid API key")
    }
  }
  // If no Bearer token, allow through (for web UI requests with cookie auth)
  
  try {
    const body = await request.json()
    const { title, description, source, agent_id, priority = 3, metadata } = body

    if (!title || !source) {
      return NextResponse.json(
        { error: "Title and source are required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("cases")
      .insert({
        title,
        description,
        source,
        agent_id,
        priority,
        metadata: metadata || {},
        status: "open"
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating case:", error)
      return NextResponse.json(
        { error: "Failed to create case" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, case: data })
  } catch (error) {
    console.error("Error in POST /api/cases:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // Validate API key for MCP House requests
  const authHeader = request.headers.get("authorization")
  if (authHeader && authHeader.startsWith("Bearer ")) {
    // This is an API request, validate the key
    if (!validateApiKey(request)) {
      console.log(`API auth failed from: ${getApiKeyFingerprint(request) || 'no-key'}`)
      return unauthorizedResponse("Invalid API key")
    }
  }
  // If no Bearer token, allow through (for web UI requests with cookie auth)
  
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const limit = parseInt(searchParams.get("limit") || "50")

    const supabase = await createClient()

    let query = supabase
      .from("cases")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq("status", status as CaseStatus)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching cases:", error)
      return NextResponse.json(
        { error: "Failed to fetch cases" },
        { status: 500 }
      )
    }

    return NextResponse.json({ cases: data })
  } catch (error) {
    console.error("Error in GET /api/cases:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}