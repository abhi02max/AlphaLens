# AlphaLens Architecture

This document describes the high-level architecture of AlphaLens.

## Core System Architecture

AlphaLens follows a standard monolithic backend with a decoupled SPA frontend, utilizing modern serverless/managed infrastructure for specific concerns.

```mermaid
graph TD
    Client[React SPA - Vercel]
    Auth[Clerk Identity Provider]
    Server[Node.js / Express - Render]
    DB[(MongoDB Atlas)]
    Cache[(Upstash Redis)]
    OpenRouter[OpenRouter AI Gateway]
    Resend[Resend Email API]

    Client <--> |HTTPS / REST| Server
    Client <--> |JWT Authentication| Auth
    Server <--> |Lazy Sync / Metadata| DB
    Server <--> |Caching| Cache
    Server <--> |LLM Inference| OpenRouter
    Server --> |Transactional| Resend
```

## AI Reasoning Flow

We use OpenRouter to access multiple LLMs (primarily `meta-llama/llama-3.1-8b-instruct`) without locking into a single provider. All AI requests go through our backend to ensure secrets are never exposed to the client.

```mermaid
sequenceDiagram
    participant User as Client
    participant API as Backend API
    participant Cache as Redis
    participant AI as OpenRouter

    User->>API: POST /api/ai/insight { symbol, mode }
    API->>Cache: Check for cached insight
    
    alt Cache Hit
        Cache-->>API: Return cached JSON
        API-->>User: Return Insight
    else Cache Miss
        API->>AI: Build prompt & request completion
        AI-->>API: Stream or return Markdown/JSON
        API->>API: Parse and structure output
        API->>Cache: Store for 24 hours
        API-->>User: Return Insight
    end
```

## Authentication Flow (Clerk)

We migrated from a custom JWT system to Clerk. The backend utilizes "Lazy Syncing" to ensure every authenticated request maps to a MongoDB user.

```mermaid
sequenceDiagram
    participant User as Client
    participant Clerk as Clerk SDK
    participant API as Express API
    participant DB as MongoDB

    User->>Clerk: Login via UI Modal
    Clerk-->>User: Return short-lived JWT token
    User->>API: Request with Bearer Token
    API->>Clerk: Validate Token (SDK)
    API->>DB: Find user by `clerkId`
    
    alt User Not Found
        API->>DB: Create user document
    end
    
    API->>API: Attach DB User object to `req.user`
    API-->>User: Secure Data Response
```
