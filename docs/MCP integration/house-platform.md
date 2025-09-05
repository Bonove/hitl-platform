# Technical Architecture: MCP House to HITL Platform Integration

## Overview

You have two separate Vercel projects that need to communicate seamlessly:

- **MCP House**: A Model Context Protocol server that exposes tools to AI agents like Retell
- **HITL Platform**: A full-featured Human-in-the-Loop interface where human operators assist AI agents

The connection enables Retell AI voice agents to escalate complex questions to human operators in real-time through the MCP protocol.

## Architecture Flow

### Primary Communication Pattern

The system follows a synchronous-with-timeout pattern where the MCP tool waits for human response while maintaining the voice call connection:

1. Retell AI invokes the "human-in-the-loop" tool via MCP protocol
2. MCP House receives the request with context (session ID, question, caller info)
3. MCP House creates a case in the HITL Platform's database via API
4. HITL Platform shows the case in real-time to available operators
5. Human operator responds through the chat interface
6. MCP House polls or uses webhooks to receive the response
7. MCP House returns the human response to Retell
8. Retell continues the conversation with the caller

## Detailed Implementation Requirements

### MCP House Configuration

The MCP server needs to expose a properly structured tool using the MCP handler pattern. The tool should:

- Accept parameters including the question, conversation context, session ID, and urgency level
- Create cases in the HITL platform using the existing API endpoints
- Implement intelligent waiting with timeout handling (typically 30-60 seconds for voice calls)
- Support both polling and webhook-based response patterns
- Handle edge cases like timeout, no operator available, or connection failures

The tool definition should use Zod schema validation for input parameters and include proper descriptions that help Retell understand when to invoke it.

### Communication Bridge Design

The bridge between MCP House and Platform uses a hybrid approach:

#### Primary: REST API for Case Creation

- MCP House calls Platform's `/api/cases` endpoint to create cases
- Includes all necessary context: question, session info, priority, metadata
- Returns case ID for tracking

#### Secondary: Response Retrieval Options

**Option A - Long Polling (Recommended for simplicity):**

- MCP House polls `/api/cases/{caseId}/messages` endpoint
- Uses exponential backoff to reduce server load
- Checks for messages with `sender_type: "human"`
- Times out after configured duration

**Option B - Webhook Callbacks:**

- MCP House provides callback URL when creating case
- Platform calls back when human responds
- Requires public endpoint on MCP House
- More complex but more efficient

**Option C - WebSocket via Pusher/Ably:**

- Real-time bidirectional communication
- MCP House subscribes to case-specific channel
- Immediate response notification
- Best for scenarios requiring sub-second latency

### Session and State Management

Since MCP is stateless and Vercel Functions have execution limits:

#### Session Correlation

- Generate unique session IDs for each HIL request
- Store session data in Supabase with TTL
- Include Retell session/call ID for correlation
- Maintain conversation context across multiple HIL invocations

#### State Storage Strategy

- **Immediate state**: In-memory during function execution
- **Persistent state**: Supabase database for case history
- **Temporary state**: Redis/Upstash for active sessions
- **Conversation context**: Stored as JSONB in case metadata

## API Contract Specifications

### Case Creation Request

The MCP House sends a POST request with:

- **Title**: Brief summary of the question
- **Description**: Full question with context
- **Source**: "mcp_house" or "retell_voice"
- **Agent ID**: Retell agent identifier
- **Priority**: 1-5 based on urgency
- **Metadata**: Contains session ID, call ID, caller info, conversation history

### Response Polling

The MCP House polls for messages containing:

- Human operator responses
- System status updates
- Resolution confirmation

### Timeout Handling

When timeout occurs:

- Return a graceful fallback message to Retell
- Mark case as "timeout" in platform
- Optionally convert to async ticket for follow-up

## Real-time Synchronization

The Platform already uses Supabase Realtime, which the MCP House can leverage:

### Notification Flow

- Case creation triggers real-time event
- Platform UI updates instantly for all operators
- Operator assignment updates case status
- Message creation triggers response event
- MCP House receives notification (if subscribed)

### Priority Queue Management

- High-priority cases (1-2) trigger audio alerts
- Visual indicators show wait time
- Automatic escalation after time thresholds
- Load balancing across available operators

## Security Considerations

### Authentication Between Services

- Shared API keys stored in environment variables
- Request signing using HMAC for webhook callbacks
- IP allowlisting for production environments
- Rate limiting to prevent abuse

## Error Handling and Resilience

### Fallback Strategies

- **No operator available**: Return polite deferral message
- **Platform unreachable**: Use cached responses or transfer call
- **Timeout**: Graceful message with callback option
- **Invalid response**: Retry with clarification request

### Circuit Breaker Pattern

- Monitor Platform availability
- Temporarily disable HIL tool if platform is down
- Provide alternative responses during outages
- Automatic recovery when service restored

## Performance Optimizations

### Response Time Targets

- **Case creation**: < 500ms
- **Initial operator notification**: < 1 second
- **Human response delivery**: < 30 seconds typical
- **Total HIL transaction**: < 45 seconds

### Caching Strategy

- Cache operator availability status
- Store frequent question/answer pairs
- Pre-warm connections to Platform API
- Use edge functions for geographic distribution

## Monitoring and Analytics

### Key Metrics to Track

- HIL invocation frequency
- Response time distribution
- Timeout rate
- Operator utilization
- Resolution success rate

### Logging Requirements

- Full request/response logging
- Conversation context preservation
- Error tracking with stack traces
- Performance profiling data

## Future Extensibility

The architecture supports adding:

- Multiple AI agent platforms beyond Retell
- Different escalation channels (Slack, Teams, Email)
- Automated response suggestions using LLMs
- Skills-based routing to specialized operators
- Multi-language support
- Video/screen sharing capabilities

## Implementation Prompt for Claude Code

```text
I need to implement the MCP House server that connects Retell AI voice agents to our HITL Platform. The MCP server should expose a 'human-in-the-loop' tool that:

- Accepts questions from Retell with full context
- Creates cases in the HITL Platform via API calls
- Waits for human responses using long polling
- Returns responses to Retell within timeout limits
- Handles all error cases gracefully

The existing HITL Platform already has:

- API endpoints for case creation and message retrieval
- Real-time updates via Supabase
- Human operator chat interface
- Case management system

Focus on:

- Implementing the MCP tool handler with proper Zod validation
- Creating the API client for Platform communication
- Building the polling mechanism with timeout
- Adding comprehensive error handling
- Ensuring voice call continuity during HIL interactions

Use the existing MCP server template structure and enhance it with the HIL tool. The Platform API is already built and documented in the codebase. Prioritize reliability and low latency for voice interactions.
```