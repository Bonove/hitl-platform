# MCP House to HITL Platform Integration - Implementation TODO List

## 🎯 Primary Goal
Connect the MCP House (Model Context Protocol server) to the HITL Platform to enable Retell AI voice agents to escalate complex questions to human operators in real-time.

## 📋 Prerequisites & Missing Data Requirements

### 1. MCP House Server Information (COMPLETED)
- [x] **MCP House Vercel Project URL** - https://mcp-house-acid-9pdryqq4i-human-in-the-loops-projects.vercel.app/
- [x] **MCP House Repository Access** - Local access available
- [x] **MCP House Environment Variables** - Configured in .env file
- [x] **MCP Server Framework Version** - Using mcp-handler package

### 2. Authentication & Security (COMPLETED)
- [x] **API Authentication Method** - Bearer token authentication implemented
  - [x] Generate shared API keys for service-to-service auth - Key: 8ee91a91d50e09c11730c09e4fcaa93940c396b106d5c877170ade36674460ed
  - [x] Store API keys in both projects' environment files (Vercel deployment pending)
  - [ ] Implement HMAC signing for webhook callbacks (if using webhooks)
- [ ] **CORS Configuration** - Set up allowed origins for cross-domain requests
- [ ] **Rate Limiting Rules** - Define request limits per minute/hour
- [ ] **IP Allowlisting** - Determine if needed for production

### 3. Retell Integration Details (REQUIRED - MISSING)
- [ ] **Retell Account Credentials** - API keys for Retell platform
- [ ] **Retell Agent IDs** - List of agent IDs that will use HIL
- [ ] **Retell Session Format** - Structure of session/call IDs from Retell
- [ ] **Retell Webhook Configuration** - If Retell needs callback URLs

## 🔧 Implementation Tasks

### Phase 1: MCP House Tool Development

#### 1.1 Tool Handler Implementation
- [x] Create `human-in-the-loop` tool in MCP House server - ALREADY IMPLEMENTED
- [ ] Implement Zod schema for tool parameters:
  ```typescript
  {
    question: string,
    context: string,
    sessionId: string,
    callId: string,
    agentId: string,
    callerInfo?: object,
    priority?: number (1-5),
    urgency?: 'low' | 'medium' | 'high',
    conversationHistory?: Array<{role: string, content: string}>
  }
  ```
- [ ] Add tool description for Retell to understand when to invoke
- [ ] Implement timeout handling (30-60 seconds for voice calls)

#### 1.2 API Client for HITL Platform
- [x] Create HTTP client for Platform API calls - ALREADY IMPLEMENTED
- [x] Implement case creation endpoint integration - ALREADY IMPLEMENTED
- [x] Add message polling functionality - ALREADY IMPLEMENTED
- [x] Handle authentication headers - ALREADY IMPLEMENTED
- [x] Implement retry logic with exponential backoff - ALREADY IMPLEMENTED

#### 1.3 Response Mechanisms
- [ ] **Option A: Long Polling** (Recommended initially)
  - [ ] Implement polling loop for `/api/cases/{caseId}/messages`
  - [ ] Add exponential backoff (start: 500ms, max: 2s)
  - [ ] Filter for `sender_type: "human"` messages
  - [ ] Implement timeout after configured duration
  
- [ ] **Option B: Webhook Callbacks** (Future enhancement)
  - [ ] Create webhook receiver endpoint in MCP House
  - [ ] Add callback URL parameter to case creation
  - [ ] Implement webhook verification/signing
  
- [ ] **Option C: WebSocket/Pusher** (Advanced)
  - [ ] Integrate Pusher/Ably client
  - [ ] Subscribe to case-specific channels
  - [ ] Handle real-time message events

### Phase 2: HITL Platform Enhancements

#### 2.1 API Endpoint Updates
- [x] Add authentication middleware to `/api/cases` endpoints - COMPLETED
- [x] Implement API key validation - COMPLETED
- [x] Add request origin validation - COMPLETED
- [x] Enhance error responses with proper status codes - COMPLETED
- [ ] Add webhook callback support to case creation

#### 2.2 Case Metadata Structure
- [ ] Extend case metadata to include:
  ```typescript
  {
    mcp_session_id: string,
    retell_call_id: string,
    retell_agent_id: string,
    caller_info: object,
    conversation_history: Array,
    response_timeout: number,
    callback_url?: string,
    webhook_secret?: string
  }
  ```

#### 2.3 Real-time Notifications
- [ ] Enhance Supabase real-time subscriptions for MCP cases
- [ ] Add priority-based audio alerts for operators
- [ ] Implement visual indicators for MCP/voice cases
- [ ] Add timeout warnings for operators

### Phase 3: Session & State Management

#### 3.1 Session Correlation System
- [ ] Generate unique session IDs for each HIL request
- [ ] Create Supabase table for session management
- [ ] Implement TTL for session cleanup
- [ ] Store conversation context across invocations

#### 3.2 State Storage Implementation
- [ ] **Database Schema Updates**
  ```sql
  CREATE TABLE hil_sessions (
    id UUID PRIMARY KEY,
    mcp_session_id TEXT UNIQUE,
    retell_call_id TEXT,
    case_id UUID REFERENCES cases(id),
    status TEXT,
    created_at TIMESTAMP,
    expires_at TIMESTAMP,
    metadata JSONB
  );
  ```
- [ ] Implement session cleanup job
- [ ] Add session recovery mechanism

### Phase 4: Error Handling & Resilience

#### 4.1 Fallback Messages
- [ ] Define fallback responses for:
  - [ ] No operator available
  - [ ] Platform unreachable
  - [ ] Timeout exceeded
  - [ ] Invalid/unclear human response
- [ ] Store fallback messages in configuration

#### 4.2 Circuit Breaker Implementation
- [ ] Monitor Platform availability
- [ ] Implement circuit breaker pattern
- [ ] Add health check endpoint
- [ ] Auto-disable HIL tool during outages
- [ ] Implement automatic recovery

### Phase 5: Performance & Monitoring

#### 5.1 Performance Targets
- [ ] Ensure case creation < 500ms
- [ ] Optimize polling for minimal latency
- [ ] Implement connection pooling
- [ ] Add caching for operator availability

#### 5.2 Logging & Analytics
- [ ] Implement comprehensive logging:
  - [ ] Request/response logging
  - [ ] Performance metrics
  - [ ] Error tracking
  - [ ] Conversation flow tracking
- [ ] Set up monitoring dashboards:
  - [ ] HIL invocation frequency
  - [ ] Response time distribution
  - [ ] Timeout rate
  - [ ] Success/failure rates

### Phase 6: Testing & Deployment

#### 6.1 Testing Strategy
- [ ] Unit tests for MCP tool handler
- [ ] Integration tests for API communication
- [ ] End-to-end tests with mock Retell calls
- [ ] Load testing for concurrent requests
- [ ] Timeout behavior testing

#### 6.2 Deployment Configuration
- [ ] Set up environment variables in both Vercel projects
- [ ] Configure production API endpoints
- [ ] Set up monitoring and alerting
- [ ] Create deployment documentation
- [ ] Implement rollback procedures

## 🔐 Security Checklist

- [ ] API keys generated and stored securely
- [ ] HTTPS enforced for all communications
- [ ] Request signing implemented
- [ ] Rate limiting configured
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention verified
- [ ] XSS protection implemented
- [ ] Audit logging enabled

## 📊 Success Metrics

- [ ] Average response time < 30 seconds
- [ ] Success rate > 95%
- [ ] Timeout rate < 5%
- [ ] Operator utilization > 70%
- [ ] Zero security incidents

## 🚀 Launch Checklist

### Pre-Production
- [ ] All authentication configured
- [ ] Error handling tested
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Documentation finalized

### Production Readiness
- [ ] Monitoring dashboards live
- [ ] Alerting configured
- [ ] Rollback plan documented
- [ ] Support team trained
- [ ] Load testing completed

## 📝 Required Documentation

- [ ] API documentation for MCP House HIL tool
- [ ] Integration guide for Retell configuration
- [ ] Operator training materials
- [ ] Troubleshooting guide
- [ ] Architecture diagrams updated

## ✅ Implementation Status

The following has been **COMPLETED**:

1. **MCP House Tool**: ✅ Already fully implemented and ready
2. **API Authentication**: ✅ Bearer token auth implemented in HITL Platform
3. **Environment Configuration**: ✅ Local .env files configured
4. **Documentation**: ✅ Complete setup instructions created

## ⚠️ Remaining Tasks

1. **Redis Setup**: Need to create Redis instance (Upstash/Redis Cloud) for MCP handler
2. **Vercel Deployment**: Set environment variables in both Vercel projects
3. **Retell Configuration**: Still need Agent IDs and webhook requirements
4. **Production Testing**: Test full integration after deployment

## 📅 Timeline Estimate

- **Phase 1-2**: 2-3 days (MCP tool & Platform API)
- **Phase 3-4**: 2 days (Session management & Error handling)
- **Phase 5**: 1 day (Performance & Monitoring)
- **Phase 6**: 2 days (Testing & Deployment)

**Total Estimate**: 7-8 days of development

## 🎯 Next Steps

1. **Immediate Action Required**:
   - Obtain MCP House repository access
   - Generate API authentication keys
   - Get Retell platform credentials
   - Confirm Vercel project URLs

2. **Once Prerequisites Met**:
   - Begin with Phase 1.1 (Tool Handler)
   - Set up development environment
   - Create API client
   - Implement basic long polling

3. **Validation**:
   - Test with mock Retell requests
   - Verify Platform API integration
   - Measure response times
   - Test error scenarios

---

**Note**: This TODO list should be updated as missing information becomes available and tasks are completed.