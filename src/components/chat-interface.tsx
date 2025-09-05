"use client"

import { useState, useRef, useEffect } from "react"
import { Tables } from "@/types/supabase"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Send, CheckCircle, Clock, User, Bot, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

type Case = Tables<"cases">
type Message = Tables<"messages">

interface ChatInterfaceProps {
  caseData: Case
  messages: Message[]
  onSendMessage: (content: string) => void
  onResolveCase: () => void
}

export function ChatInterface({
  caseData,
  messages,
  onSendMessage,
  onResolveCase,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input.trim())
      setInput("")
      textareaRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="outline" className="gap-1"><AlertCircle className="h-3 w-3" /> Open</Badge>
      case "in_progress":
        return <Badge variant="outline" className="gap-1 border-blue-500 text-blue-500"><Clock className="h-3 w-3" /> In Progress</Badge>
      case "resolved":
        return <Badge variant="outline" className="gap-1 border-green-500 text-green-500"><CheckCircle className="h-3 w-3" /> Resolved</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: number | null) => {
    if (!priority) return null
    const colors = {
      1: "bg-red-100 text-red-800 border-red-200",
      2: "bg-orange-100 text-orange-800 border-orange-200",
      3: "bg-yellow-100 text-yellow-800 border-yellow-200",
      4: "bg-blue-100 text-blue-800 border-blue-200",
      5: "bg-gray-100 text-gray-800 border-gray-200"
    }
    return (
      <Badge variant="outline" className={cn("font-normal", colors[priority as keyof typeof colors])}>
        Priority {priority}
      </Badge>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold truncate">{caseData.title}</h2>
          <div className="flex items-center gap-2">
            {getStatusBadge(caseData.status || "open")}
            {getPriorityBadge(caseData.priority)}
          </div>
        </div>
        {caseData.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{caseData.description}</p>
        )}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Source: {caseData.source}</span>
          {caseData.agent_id && <span>Agent: {caseData.agent_id}</span>}
        </div>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.sender_type === "human" && "flex-row-reverse"
              )}
            >
              <div className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                message.sender_type === "human" 
                  ? "bg-primary text-primary-foreground" 
                  : message.sender_type === "ai_agent"
                  ? "bg-secondary"
                  : "bg-muted"
              )}>
                {message.sender_type === "human" ? (
                  <User className="h-4 w-4" />
                ) : message.sender_type === "ai_agent" ? (
                  <Bot className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
              </div>
              <div className={cn(
                "flex flex-col gap-1 max-w-[70%]",
                message.sender_type === "human" && "items-end"
              )}>
                <div className={cn(
                  "rounded-lg px-3 py-2",
                  message.sender_type === "human"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(message.created_at || "").toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-secondary">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-lg bg-muted px-3 py-2">
                <div className="flex space-x-1">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-500 [animation-delay:-0.3s]"></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-500 [animation-delay:-0.15s]"></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-500"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t p-4 space-y-3">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message to assist the AI agent..."
            className="resize-none"
            rows={3}
          />
          <div className="flex flex-col gap-2">
            <Button 
              onClick={handleSend} 
              size="icon"
              disabled={!input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
            {caseData.status !== "resolved" && (
              <Button 
                onClick={onResolveCase}
                size="icon"
                variant="outline"
                className="text-green-600 hover:text-green-700"
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}