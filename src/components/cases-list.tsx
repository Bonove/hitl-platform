"use client"

import { Tables } from "@/types/supabase"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertCircle, Clock, CheckCircle, MessageSquare, User } from "lucide-react"
import { cn } from "@/lib/utils"

type Case = Tables<"cases">

interface CasesListProps {
  cases: Case[]
  selectedCase: Case | null
  onSelectCase: (caseItem: Case) => void
}

export function CasesList({ cases, selectedCase, onSelectCase }: CasesListProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case "in_progress":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <MessageSquare className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getPriorityColor = (priority: number | null) => {
    if (!priority) return ""
    switch (priority) {
      case 1:
        return "border-l-4 border-l-red-500"
      case 2:
        return "border-l-4 border-l-orange-500"
      case 3:
        return "border-l-4 border-l-yellow-500"
      case 4:
        return "border-l-4 border-l-blue-500"
      default:
        return "border-l-4 border-l-gray-300"
    }
  }

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return ""
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) return `${diffDays}d ago`
    if (diffHours > 0) return `${diffHours}h ago`
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    if (diffMinutes > 0) return `${diffMinutes}m ago`
    return "Just now"
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Active Cases</h2>
        <p className="text-sm text-muted-foreground">
          {cases.filter(c => c.status !== "resolved").length} open cases
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {cases.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No cases available. Waiting for AI agents to request assistance...
            </div>
          ) : (
            <div className="space-y-2">
              {cases.map((caseItem) => (
                <button
                  key={caseItem.id}
                  onClick={() => onSelectCase(caseItem)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border transition-colors",
                    getPriorityColor(caseItem.priority),
                    selectedCase?.id === caseItem.id
                      ? "bg-accent border-accent-foreground/20"
                      : "hover:bg-accent/50"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusIcon(caseItem.status || "open")}
                        <span className="font-medium text-sm truncate">
                          {caseItem.title}
                        </span>
                      </div>
                      {caseItem.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {caseItem.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {caseItem.source}
                        </span>
                        {caseItem.assignee_id && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Assigned
                          </span>
                        )}
                        <span>{formatTime(caseItem.created_at)}</span>
                      </div>
                    </div>
                    {caseItem.priority && caseItem.priority <= 2 && (
                      <Badge variant="destructive" className="shrink-0 text-xs">
                        Urgent
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}