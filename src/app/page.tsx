"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { Tables } from "@/types/supabase"
import { ChatInterface } from "@/components/chat-interface"
import { CaseDetails } from "@/components/case-details"
import { CasesList } from "@/components/cases-list"

type Case = Tables<"cases">
type Message = Tables<"messages">

export default function HITLPlatform() {
  const [cases, setCases] = useState<Case[]>([])
  const [selectedCase, setSelectedCase] = useState<Case | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
    loadCases()
    subscribeToUpdates()
  }, [])

  useEffect(() => {
    if (selectedCase) {
      loadMessages(selectedCase.id)
      subscribeToMessages(selectedCase.id)
    }
  }, [selectedCase])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push("/login")
      return
    }
    setLoading(false)
  }

  const loadCases = async () => {
    try {
      const { data, error } = await supabase
        .from("cases")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setCases(data || [])
    } catch (error) {
      console.error("Error loading cases:", error)
    }
  }

  const loadMessages = async (caseId: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("case_id", caseId)
        .order("created_at", { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error("Error loading messages:", error)
    }
  }

  const subscribeToUpdates = () => {
    const channel = supabase
      .channel("cases_updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cases" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setCases((prev) => [payload.new as Case, ...prev])
          } else if (payload.eventType === "UPDATE") {
            setCases((prev) =>
              prev.map((c) => (c.id === payload.new.id ? payload.new as Case : c))
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const subscribeToMessages = (caseId: string) => {
    const channel = supabase
      .channel(`messages_${caseId}`)
      .on(
        "postgres_changes",
        { 
          event: "INSERT", 
          schema: "public", 
          table: "messages",
          filter: `case_id=eq.${caseId}`
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const handleSendMessage = async (content: string) => {
    if (!selectedCase) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      const { error } = await supabase.from("messages").insert({
        case_id: selectedCase.id,
        content,
        sender_type: "human",
        sender_id: user.id,
      })

      if (error) throw error

      if (selectedCase.status === "open") {
        await supabase
          .from("cases")
          .update({ status: "in_progress", assignee_id: user.id })
          .eq("id", selectedCase.id)
      }
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  const handleResolveCase = async () => {
    if (!selectedCase) return

    try {
      const { error } = await supabase
        .from("cases")
        .update({ 
          status: "resolved", 
          resolved_at: new Date().toISOString() 
        })
        .eq("id", selectedCase.id)

      if (error) throw error
    } catch (error) {
      console.error("Error resolving case:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading HITL Platform...</div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-57px)] bg-background">
      <div className="w-1/2 border-r flex flex-col">
        {selectedCase ? (
          <ChatInterface
            caseData={selectedCase}
            messages={messages}
            onSendMessage={handleSendMessage}
            onResolveCase={handleResolveCase}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a case to start conversation
          </div>
        )}
      </div>

      <div className="w-1/2 flex flex-col">
        <div className="h-1/2 border-b overflow-auto">
          <CasesList
            cases={cases}
            selectedCase={selectedCase}
            onSelectCase={setSelectedCase}
          />
        </div>
        <div className="h-1/2 overflow-auto">
          {selectedCase && (
            <CaseDetails
              caseData={selectedCase}
              messages={messages}
            />
          )}
        </div>
      </div>
    </div>
  )
}
