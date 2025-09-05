import { createClient } from "@/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { validateApiKey, unauthorizedResponse, getApiKeyFingerprint } from "@/utils/auth/api-auth"
import OpenAI from "openai"
import { ChatCompletionMessageParam } from "openai/resources/index.mjs"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
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
    const { caseId } = await params
    const body = await request.json()
    const { content, sender_type, sender_id, request_ai_response = false } = body

    if (!content || !sender_type) {
      return NextResponse.json(
        { error: "Content and sender_type are required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Insert the message
    const { data: message, error: messageError } = await supabase
      .from("messages")
      .insert({
        case_id: caseId,
        content,
        sender_type,
        sender_id,
      })
      .select()
      .single()

    if (messageError) {
      console.error("Error creating message:", messageError)
      return NextResponse.json(
        { error: "Failed to create message" },
        { status: 500 }
      )
    }

    // Update case status if it's the first response
    if (sender_type === "ai_agent") {
      const { error: updateError } = await supabase
        .from("cases")
        .update({ status: "open" })
        .eq("id", caseId)
        .eq("status", "open")

      if (updateError) {
        console.error("Error updating case status:", updateError)
      }
    }

    // If AI response is requested, generate one using OpenAI
    let aiResponse = null
    if (request_ai_response && process.env.OPENAI_API_KEY) {
      try {
        // Get case context
        const { data: caseData } = await supabase
          .from("cases")
          .select("*")
          .eq("id", caseId)
          .single()

        // Get recent messages for context
        const { data: recentMessages } = await supabase
          .from("messages")
          .select("*")
          .eq("case_id", caseId)
          .order("created_at", { ascending: false })
          .limit(10)

        // Prepare context for AI
        const context: ChatCompletionMessageParam[] = recentMessages?.reverse().map(msg => ({
          role: msg.sender_type === "human" ? "assistant" as const : "user" as const,
          content: msg.content
        })) || []

        const completion = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || "gpt-5-mini",
          messages: [
            {
              role: "system",
              content: `You are a helpful assistant managing a Human-in-the-Loop case. 
                Case: ${caseData?.title}
                Description: ${caseData?.description}
                Source: ${caseData?.source}
                Help the human operator understand and resolve this case.`
            },
            ...context,
            { role: "user", content: content }
          ],
          temperature: 0.7,
          max_tokens: 500
        })

        aiResponse = completion.choices[0]?.message?.content

        // Store AI response as a message
        if (aiResponse) {
          await supabase
            .from("messages")
            .insert({
              case_id: caseId,
              content: aiResponse,
              sender_type: "ai_agent",
              sender_id: "openai",
            })
        }
      } catch (aiError) {
        console.error("Error generating AI response:", aiError)
      }
    }

    return NextResponse.json({ 
      success: true, 
      message, 
      ai_response: aiResponse 
    })
  } catch (error) {
    console.error("Error in POST /api/cases/[caseId]/messages:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
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
    const { caseId } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("case_id", caseId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching messages:", error)
      return NextResponse.json(
        { error: "Failed to fetch messages" },
        { status: 500 }
      )
    }

    return NextResponse.json({ messages: data })
  } catch (error) {
    console.error("Error in GET /api/cases/[caseId]/messages:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}