# HITL Platform Setup Guide

## Quick Start

### 1. Environment Variables
Ensure your `.env.local` file has the required Supabase and OpenAI credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://uefinkkvpjsttmldajzn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5-mini
```

### 2. Database Setup
The database schema has been created. Tables include:
- `cases` - Stores questions/issues from AI agents
- `messages` - Stores conversation history
- Both tables have RLS policies enabled

### 3. Running the Application

```bash
npm run dev
```

Visit http://localhost:3000

### 4. Testing the Platform

#### Create a Test Case via API

```bash
curl -X POST http://localhost:3000/api/cases \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Case - Customer Billing Issue",
    "description": "Customer asking about complex refund policy",
    "source": "voicebot",
    "agent_id": "test_agent_001",
    "priority": 2
  }'
```

#### Send a Test Message

```bash
curl -X POST http://localhost:3000/api/cases/{CASE_ID}/messages \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Customer is asking about refund for order #12345 purchased 3 months ago",
    "sender_type": "ai_agent",
    "sender_id": "test_agent_001",
    "request_ai_response": true
  }'
```

### 5. Platform Features

- **Left Panel**: Real-time chat interface for human-AI interaction
- **Right Panel Top**: List of active cases with priority indicators
- **Right Panel Bottom**: Detailed case information and statistics

### 6. Authentication

1. Visit http://localhost:3000
2. You'll be redirected to /login if not authenticated
3. Click "Sign in with Google" to authenticate
4. After successful login, you'll see the HITL platform interface

### 7. MCP House Integration

The platform exposes the following endpoints for integration:

- `POST /api/cases` - Create new case
- `GET /api/cases` - List cases
- `POST /api/cases/{caseId}/messages` - Add message to case
- `GET /api/cases/{caseId}/messages` - Get case messages

### 8. Real-time Updates

The platform uses Supabase Realtime for:
- New case notifications
- Message updates
- Status changes

All updates appear instantly without page refresh.

## Troubleshooting

### Database Connection Issues
- Verify Supabase credentials in `.env.local`
- Check if Supabase project is active at https://supabase.com/dashboard

### Authentication Issues  
- Ensure Google OAuth is configured in Supabase Auth settings
- Check redirect URL is correctly set to `http://localhost:3000/auth/callback`

### OpenAI Integration
- Verify `OPENAI_API_KEY` is valid
- Check `OPENAI_MODEL` is set to a valid model name

## What's Been Implemented

✅ Complete replacement of boilerplate with HITL platform
✅ Database schema for cases and conversations
✅ Real-time chat interface on the left
✅ Case management system on the right
✅ API endpoints for MCP house integration  
✅ OpenAI SDK integration for AI responses
✅ Google OAuth authentication
✅ Real-time updates with Supabase
✅ Priority-based case sorting
✅ Case resolution workflow

The platform is now ready for testing and integration with your AI agents!