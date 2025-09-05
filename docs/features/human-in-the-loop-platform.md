# Human in the Loop (HITL) Platform

## Overview

The HITL Platform is a real-time support system that handles questions and cases from AI voice agents and chatbots that require human intervention. When AI agents encounter complex scenarios they cannot resolve autonomously, they forward these cases to the HITL platform where human operators can provide assistance.

## Architecture

### Database Schema

The platform uses Supabase for data storage with the following schema:

#### Cases Table
- `id`: UUID primary key
- `title`: Case title/summary
- `description`: Detailed description  
- `status`: Enum (open, in_progress, resolved, closed)
- `source`: Origin of the case (voicebot, chatbot, mcp_house)
- `agent_id`: ID of the AI agent that created the case
- `assignee_id`: User ID of the human operator handling the case
- `priority`: Integer 1-5 (1 = highest priority)
- `metadata`: JSONB for additional context
- `created_at`, `updated_at`, `resolved_at`: Timestamps

#### Messages Table
- `id`: UUID primary key
- `case_id`: Foreign key to cases table
- `sender_type`: Enum (human, ai_agent, system)
- `sender_id`: ID of the sender
- `content`: Message text
- `metadata`: JSONB for additional data
- `created_at`: Timestamp

## Key Features

### 1. Real-time Case Management
- Live updates when new cases arrive from AI agents
- Real-time status tracking (open → in_progress → resolved)
- Priority-based case display with visual indicators
- Automatic case assignment when operators start responding

### 2. Split-Screen Interface

#### Left Panel - Chat Interface
- Real-time conversation between human operator and AI agent
- Message history with sender identification
- Quick resolve button for closing cases
- Supports human messages, AI agent messages, and system notifications

#### Right Panel - Case Management
- **Top Section**: Active cases list
  - Visual priority indicators (color-coded borders)
  - Status badges (Open, In Progress, Resolved)
  - Source identification (voicebot, chatbot, etc.)
  - Time-based sorting with "time ago" display
  
- **Bottom Section**: Case details view
  - Complete case information
  - Conversation statistics
  - Resolution time tracking
  - Metadata display

### 3. API Integration

The platform exposes REST APIs for MCP house and AI agent integration:

#### Create Case
```http
POST /api/cases
Content-Type: application/json

{
  "title": "Customer needs help with billing",
  "description": "Complex billing issue requiring human review",
  "source": "voicebot",
  "agent_id": "agent_123",
  "priority": 2,
  "metadata": {
    "customer_id": "cust_456",
    "session_id": "sess_789"
  }
}
```

#### Send Message
```http
POST /api/cases/{caseId}/messages
Content-Type: application/json

{
  "content": "The customer is asking about a refund for order #12345",
  "sender_type": "ai_agent",
  "sender_id": "agent_123",
  "request_ai_response": true
}
```

#### Get Case Messages
```http
GET /api/cases/{caseId}/messages
```

#### List Cases
```http
GET /api/cases?status=open&limit=50
```

### 4. AI-Powered Assistance

When `request_ai_response` is set to true in message creation, the platform:
1. Retrieves case context and recent messages
2. Sends to OpenAI for suggested response
3. Returns AI-generated assistance to help operators
4. Uses the configured `OPENAI_MODEL` environment variable

### 5. Real-time Updates

The platform uses Supabase Realtime subscriptions for:
- New case notifications
- Case status updates  
- New messages in active conversations
- Automatic UI updates without page refresh

## Authentication

The platform uses Supabase Auth with Google OAuth:
- Operators sign in with Google accounts
- Protected routes require authentication
- Session management handled by Supabase

## Environment Configuration

Required environment variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration  
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5-mini  # or your preferred model
```

## Usage Flow

1. **AI Agent Creates Case**: When an AI agent encounters a question it cannot answer, it calls the `/api/cases` endpoint to create a new case

2. **Human Operator Views Cases**: Operators see new cases appear in real-time on the right panel, sorted by priority and creation time

3. **Operator Selects Case**: Clicking a case loads the conversation in the left chat panel and full details in the bottom-right panel

4. **Real-time Conversation**: The operator can chat with the AI agent through the platform, with messages synced in real-time

5. **Resolution**: Once the issue is resolved, the operator clicks the resolve button to close the case

6. **Historical Access**: All resolved cases and conversations are stored for future reference and analysis

## Technical Stack

- **Frontend**: Next.js 15 with App Router, TypeScript, React 19
- **UI Components**: shadcn/ui with Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime subscriptions
- **AI Integration**: OpenAI SDK
- **Authentication**: Supabase Auth with Google OAuth

## File Structure

```
src/
├── app/
│   ├── page.tsx                 # Main HITL platform interface
│   ├── login/page.tsx           # Authentication page
│   ├── auth/callback/route.ts   # OAuth callback handler
│   └── api/
│       └── cases/
│           ├── route.ts         # Case CRUD operations
│           └── [caseId]/
│               └── messages/
│                   └── route.ts # Message operations
├── components/
│   ├── chat-interface.tsx      # Left panel chat component
│   ├── cases-list.tsx          # Right panel cases list
│   └── case-details.tsx        # Case details view
├── types/
│   └── supabase.ts             # Generated database types
└── utils/
    └── supabase/
        ├── client.ts           # Client-side Supabase client
        └── server.ts           # Server-side Supabase client
```

## Security Considerations

- Row Level Security (RLS) enabled on all tables
- Authenticated users can view and manage all cases
- API endpoints require proper authentication
- Sensitive data should be stored in metadata fields with appropriate access controls

## Future Enhancements

- User role management (admin, operator, viewer)
- Case analytics and reporting
- File attachment support
- Voice note integration
- Multi-language support
- Webhook notifications
- Advanced filtering and search
- Case templates for common issues