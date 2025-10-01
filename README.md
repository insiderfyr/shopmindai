# Chat.ShopMindAI Project Analysis and Integration Guide

## Complete Analysis

### Project Structure
The project is a microservices-based application with a React frontend and Go backend services. Key components:
- **Frontend**: Vite-based React app in `apps/web` for the user interface, likely a chat application based on LibreChat.
- **Microservices**:
  - **Auth Service**: Handles authentication using Keycloak, with endpoints for login, register, profile, etc.
  - **Chat Service**: Manages chat functionality, exposed on port 8080.
  - **LLM Proxy**: Proxies requests to LLM providers (e.g., OpenAI), with streaming chat endpoint.
  - **Orchestrator**: Main API orchestrator, proxies to LLM and handles sessions.
- **Infra**: Kong API Gateway for routing requests to microservices.
- **Mock**: Mock server for development/testing.

### Architecture
- Frontend communicates with backend via API calls, proxied through Vite in development.
- Microservices are containerized with Docker, using docker-compose for orchestration.
- Kong acts as the API gateway, routing requests to appropriate services with CORS support.
- Authentication is handled by Keycloak integrated in auth service, supporting password and potentially OAuth flows.

### Endpoints
- **Auth**: /api/v1/auth/login, /api/v1/auth/register, /api/v1/user/profile, etc.
- **Chat Service**: /chat (healthz, etc.)
- **LLM Proxy**: /llm/v1/chat/stream
- **Orchestrator**: /api (main API, streaming messages)

### Integration Changes
- Updated Kong configuration to route /api to orchestrator, /api/auth to auth, /llm to llm-proxy, /chat to chat-service.
- Enabled OpenID (Keycloak) in auth config for OAuth login in frontend.
- Updated Vite proxy to point to Kong (localhost:8088) for all API calls.

## How to Run and Connect
1. **Start Gateway**: `cd microservices/infra/gateway && docker-compose up -d`
2. **Start Services**: `docker-compose up -d` in root, and in services-new/auth if separate.
3. **Start Frontend**: `cd apps/web && npm install && npm run dev`
4. Access at http://localhost:3090, login using Keycloak or password.
5. Frontend now connects to microservices via Kong gateway.

For testing, ensure all containers are running and check logs for connections.

## Dev Tooling & Environment

- Follow `docs/dev-tooling.md` for the ordered startup flow (mock → Vite → auth/Keycloak → Kong), the pre-flight health checklist, and the three near-term workstreams.
- Shared environment defaults now live under `env/shared/.env.example`; copy the per-service examples in `env/*/.env.example` to create your local overrides before starting Docker stacks.
