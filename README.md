# rest-apis-design

A focused Node.js (Express) exploration of idempotency as a first-class API design concern — built around a payment charge endpoint that demonstrates how to make non-idempotent operations safe to retry. Uses Redis to store keyed responses, SHA-256 payload hashing to detect conflicting requests, and response interception to capture the result at the point it leaves the server.

## Description

`rest-apis-design` is a minimal but deliberately complete reference for implementing the Idempotency-Key pattern on a write operation. The problem it addresses is concrete: a client sends a charge request, the server processes it and charges the customer, but the response never reaches the client (network drop, timeout, server restart). The client can't tell whether the charge went through. Retrying without idempotency means charging the customer twice.

The solution: the client generates a unique key for each logical operation and sends it in the `Idempotency-Key` header. The server stores the response in Redis under that key before sending it. If the same key arrives again — regardless of whether the first response was delivered — the server returns the stored result instead of processing a new charge. The client retries freely; the customer is charged exactly once.

The implementation adds one more layer: payload hashing. Before storing, the middleware computes a SHA-256 hash of the request body and stores it alongside the response. On replay, it recomputes the hash and checks it against the stored one. If the hashes differ — same key, different payload — that's a conflicting request (the client is reusing a key it already used for something else), and the server rejects it with `422 Unprocessable Entity`. Same key, same payload: safe replay, returns the stored response with `"idempotent": true`.

## Features

- **Idempotency-Key Header:** Clients supply a UUID (or any unique string) per logical operation. The server keys the stored response off it.
- **Redis-Backed Response Store:** Processed responses are stored in Redis under `idempotency:<key>` with a 24-hour TTL — long enough to cover any realistic retry window.
- **SHA-256 Payload Hashing:** The request body is hashed before storage. Replays with a mismatched hash are rejected as conflicting requests before processing begins.
- **Response Interception:** The middleware wraps `res.json` to capture the outbound response at the point it would leave the server, storing it atomically before the bytes hit the wire.
- **Idempotent Reply Flag:** Replayed responses include `"idempotent": true` so clients can distinguish a fresh `201` from a replayed one.
- **Payload Validation:** Strict field-level validation (amount, currency, customerId, description, Idempotency-Key) via `express-validator`, with a centralized bad-request handler that short-circuits the chain before the key lookup runs.
- **Centralized Error Handling:** All error-to-response mapping flows through a single `exceptionHandler` middleware with typed custom exceptions.

## How Idempotency Works

```
Client                          Server                      Redis
  |                               |                           |
  |-- POST /v1/idempotency/charge -->|                        |
  |   Idempotency-Key: <uuid>     |                           |
  |   { amount, currency, ... }   |                           |
  |                               |-- GET idempotency:<key> ->|
  |                               |<-- null (not found) ------|
  |                               |                           |
  |                               | [hash payload, wrap res.json]
  |                               | [process charge ...]      |
  |                               |                           |
  |                               |-- SET idempotency:<key> ->|
  |                               |   { payloadHash, result } |
  |<-- 201 { chargeId, ... } -----|<-- OK --------------------|
  |                               |                           |
  |   (network drops, client retries)                         |
  |                               |                           |
  |-- POST /v1/idempotency/charge -->|                        |
  |   Idempotency-Key: <uuid>     |                           |
  |   { amount, currency, ... }   |                           |
  |                               |-- GET idempotency:<key> ->|
  |                               |<-- { payloadHash, result }|
  |                               | [hash matches ✓]          |
  |<-- 200 { chargeId, ..., idempotent: true } --------------|
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/v1/idempotency/charge` | Process a charge (idempotent) |
| `GET` | `/health` | Liveness check |

### `POST /v1/idempotency/charge`

**Required header:**

```
Idempotency-Key: <unique-string-per-logical-operation>
```

**Request body:**

```json
{
  "amount": 5000,
  "currency": "USD",
  "customerId": "cust_abc123",
  "description": "Order #789 — annual plan"
}
```

| Field | Type | Rules |
|-------|------|-------|
| `amount` | integer | Required. Positive integer greater than 1 (smallest unit, e.g. cents). |
| `currency` | string | Required. One of `USD`, `EUR`, `GBP`, `KES`. |
| `customerId` | string | Required. Non-empty string. |
| `description` | string | Optional. |
| `Idempotency-Key` | header | Required. Non-empty string — use a UUID per unique operation. |

**First call — `201 Created`:**

```json
{
  "code": 201,
  "message": "Charge processed successfully.",
  "data": {
    "chargeId": "ch_a1b2c3d4e5f6",
    "amount": 5000,
    "currency": "USD",
    "customerId": "cust_abc123",
    "description": "Order #789 — annual plan",
    "status": "success",
    "createdAt": "2026-09-12T10:00:00.000Z"
  }
}
```

**Replay (same key, same payload) — `200 OK`:**

```json
{
  "code": 201,
  "message": "Charge processed successfully.",
  "data": { "chargeId": "ch_a1b2c3d4e5f6", ... },
  "idempotent": true
}
```

**Conflict (same key, different payload) — `422 Unprocessable Entity`:**

```json
{
  "message": "The request could not be processed. Please try again later."
}
```

## Prerequisites

- Node.js (LTS)
- Redis 7+

## Technologies Used

| Concern | Technology |
|---------|-----------|
| Framework | Express.js 5 |
| Cache / idempotency store | Redis via ioredis |
| Payload hashing | Node.js `crypto` (SHA-256) |
| Validation | express-validator |
| ID generation | uuid |
| Environment config | dotenv |
| Dev server | nodemon |

## Environment Variables

Create a `.env` file in the root directory:

```sh
PORT=3000
REDIS_URL=redis://localhost:6379
```

## Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/YomZsamora/rest-apis-design.git
cd rest-apis-design

# 2. Install dependencies
npm install

# 3. Create and configure your .env file
cp .env.example .env
# Edit .env with your values

# 4. Start the development server
npm run dev
```

The service will be available at `http://localhost:3000`. Use Postman or any HTTP client to interact with the API.

## Generating Idempotency Keys

The key can be any non-empty string, but a UUID per logical operation is the standard convention:

```js
// Node.js
const { randomUUID } = require('crypto');
const idempotencyKey = randomUUID(); // "550e8400-e29b-41d4-a716-446655440000"
```

```bash
# Shell (macOS / Linux)
uuidgen
```

Generate the key **before** sending the request. Store it alongside the operation so you can reuse the same key on retry — never generate a new key for a retry, or idempotency provides no protection.

## Key Design Decisions

**Why intercept `res.json` instead of storing after the handler returns?**

The middleware wraps `res.json` before calling `next()`, so the response is captured and stored atomically at the point it leaves the application layer — before any flush to the socket. Storing in a `finally` block after `next()` would miss cases where the handler throws or the response is sent through a non-standard path.

**Why hash the payload instead of trusting the key alone?**

The key alone guarantees replay safety but not correctness. A client bug that generates the same key for two different charges (e.g. seeded PRNG, copy-paste error) would silently return the wrong result. The hash check makes that class of bug visible as a `422` instead of a silent wrong answer.

**Why 24 hours for the TTL?**

Long enough to cover the tail of any realistic retry window — network partitions, client restarts, delayed job queues. Short enough to reclaim Redis memory. The TTL is set on first write; replays within the window are served from cache; after expiry the key is treated as new.

## Development

Want to contribute? Here's how:

- Fork the repository
- Create a new branch (`git checkout -b feature/your-feature-name`)
- Make your changes
- Commit your changes using Conventional Commits (`feat:`, `fix:`, `refactor:`, etc.)
- Push to your branch (`git push origin feature/your-feature-name`)
- Open a Pull Request describing what changed and why

## Known Bugs

If you encounter any bugs or issues, please open an issue on the GitHub repository. Include a description of the issue and the steps to reproduce it.

## License

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
