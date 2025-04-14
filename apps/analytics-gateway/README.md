# Analytics Gateway

A lightweight service for collecting and processing analytics events using Hono.js.

## Features

- RESTful API endpoint for receiving analytics events (`/v1/events`)
- Input validation using Zod
- CLI tool for sending test events
- OpenAPI documentation
- Rate limiting

## Getting Started

### Installation

```bash
# From the monorepo root
pnpm install
```

### Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Modify the variables as needed.

### Development

```bash
# From the monorepo root
pnpm --filter analytics-gateway dev
```

### Production Build

```bash
# From the monorepo root
pnpm --filter analytics-gateway build
pnpm --filter analytics-gateway start
```

## API Usage

### Sending Events

Send an event to the analytics gateway:

```
POST /v1/events
Content-Type: application/json

{
  "id": "1234-5678-9101-1121",
  "payload": {
    "action": "page_view",
    "page": "/homepage",
    "user_id": "usr_123"
  }
}
```

Response:

```json
{
  "success": true,
  "message": "Event received successfully",
  "eventId": "1234-5678-9101-1121"
}
```

## CLI Usage

The analytics gateway comes with a CLI tool for sending events.

### Send a Custom Event

```bash
# From the monorepo root
pnpm --filter analytics-gateway cli send-event -p '{"action":"page_view","page":"/homepage"}'

# With custom event ID
pnpm --filter analytics-gateway cli send-event -i "custom-id-123" -p '{"action":"page_view","page":"/homepage"}'

# To a custom endpoint
pnpm --filter analytics-gateway cli send-event -u "http://analytics.example.com/v1/events" -p '{"action":"page_view"}'
```

### Generate a Test Event

```bash
# From the monorepo root
pnpm --filter analytics-gateway cli generate-test
```

## API Documentation

API documentation is available at:

- `/api-docs/openapi.json` - OpenAPI specification
