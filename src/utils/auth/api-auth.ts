import { NextRequest, NextResponse } from "next/server"

/**
 * Validates API key from Authorization header
 * Expected format: "Bearer <api-key>"
 */
export function validateApiKey(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization")
  
  if (!authHeader) {
    return false
  }
  
  if (!authHeader.startsWith("Bearer ")) {
    return false
  }
  
  const providedKey = authHeader.slice(7) // Remove "Bearer " prefix
  const validKey = process.env.HITL_API_KEY
  
  if (!validKey) {
    console.error("HITL_API_KEY environment variable not configured")
    return false
  }
  
  // Constant-time comparison to prevent timing attacks
  if (providedKey.length !== validKey.length) {
    return false
  }
  
  let mismatch = 0
  for (let i = 0; i < providedKey.length; i++) {
    mismatch |= providedKey.charCodeAt(i) ^ validKey.charCodeAt(i)
  }
  
  return mismatch === 0
}

/**
 * Middleware response for unauthorized requests
 */
export function unauthorizedResponse(message = "Unauthorized"): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 401 }
  )
}

/**
 * Extract API key source for logging (first 8 chars)
 */
export function getApiKeyFingerprint(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }
  
  const key = authHeader.slice(7)
  if (key.length < 8) {
    return null
  }
  
  return key.slice(0, 8) + "..."
}