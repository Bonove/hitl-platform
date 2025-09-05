"use client"

import { Tables } from "@/types/supabase"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertCircle, Clock, CheckCircle, Calendar, User, Bot, MessageSquare, Hash } from "lucide-react"

type Case = Tables<"cases">
type Message = Tables<"messages">

interface CaseDetailsProps {
  caseData: Case
  messages: Message[]
}

export function CaseDetails({ caseData, messages }: CaseDetailsProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return (
          <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-600">
            <AlertCircle className="h-3 w-3" />
            Open
          </Badge>
        )
      case "in_progress":
        return (
          <Badge variant="outline" className="gap-1 border-blue-500 text-blue-600">
            <Clock className="h-3 w-3" />
            In Progress
          </Badge>
        )
      case "resolved":
        return (
          <Badge variant="outline" className="gap-1 border-green-500 text-green-600">
            <CheckCircle className="h-3 w-3" />
            Resolved
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDateTime = (timestamp: string | null) => {
    if (!timestamp) return "N/A"
    return new Date(timestamp).toLocaleString()
  }

  const messageStats = {
    total: messages.length,
    human: messages.filter(m => m.sender_type === "human").length,
    ai: messages.filter(m => m.sender_type === "ai_agent").length,
    system: messages.filter(m => m.sender_type === "system").length,
  }

  const timeToResolve = () => {
    if (!caseData.resolved_at || !caseData.created_at) return null
    const created = new Date(caseData.created_at).getTime()
    const resolved = new Date(caseData.resolved_at).getTime()
    const diff = resolved - created
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Case Details</h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{caseData.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {caseData.description || "No description provided"}
                  </CardDescription>
                </div>
                {getStatusBadge(caseData.status || "open")}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Hash className="h-3 w-3" />
                    <span>Case ID:</span>
                  </div>
                  <p className="font-mono text-xs">{caseData.id}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MessageSquare className="h-3 w-3" />
                    <span>Source:</span>
                  </div>
                  <p className="font-medium">{caseData.source}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Bot className="h-3 w-3" />
                    <span>Agent ID:</span>
                  </div>
                  <p className="font-mono text-xs">{caseData.agent_id || "N/A"}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>Assignee:</span>
                  </div>
                  <p>{caseData.assignee_id ? "Assigned" : "Unassigned"}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Created:</span>
                  </div>
                  <p className="text-xs">{formatDateTime(caseData.created_at)}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Priority:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-2 w-6 rounded ${
                            level <= (caseData.priority || 3)
                              ? level <= 2
                                ? "bg-red-500"
                                : level === 3
                                ? "bg-yellow-500"
                                : "bg-blue-500"
                              : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs">Level {caseData.priority || 3}</span>
                  </div>
                </div>
              </div>

              {caseData.resolved_at && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Resolved At:</span>
                    <span>{formatDateTime(caseData.resolved_at)}</span>
                  </div>
                  {timeToResolve() && (
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-muted-foreground">Time to Resolve:</span>
                      <span className="font-medium">{timeToResolve()}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Conversation Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{messageStats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Messages</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{messageStats.human}</p>
                  <p className="text-xs text-muted-foreground">Human Messages</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{messageStats.ai}</p>
                  <p className="text-xs text-muted-foreground">AI Messages</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{messageStats.system}</p>
                  <p className="text-xs text-muted-foreground">System Messages</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {caseData.metadata && Object.keys(caseData.metadata as object).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Additional Metadata</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                  {JSON.stringify(caseData.metadata, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}