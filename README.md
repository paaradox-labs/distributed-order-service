# MERN Space - Order Service

A microservice for managing orders within a distributed system. Part of the CGS distributed architecture.

## Tech Stack

- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js v5
- **Database:** MongoDB via Mongoose v9
- **Auth:** JWT / RS256 (express-jwt + jwks-rsa)
- **Messaging:** Apache Kafka via KafkaJS
- **Logging:** Winston
- **Config:** node-config (YAML)

## Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- MongoDB instance (standalone requires `retryWrites=false` in connection string)
- Apache Kafka broker (for product/topping cache updates)

## Getting Started

```bash
pnpm install
pnpm dev
```

The server starts on port **5503** (development) or **5502** (production).

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start dev server with hot-reload |
| `pnpm build` | Lint + compile TypeScript |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Format with Prettier |

## Project Structure

```
├── config/                    # node-config YAML files
│   ├── default.yaml
│   ├── development.yaml
│   └── production.yaml
├── src/
│   ├── common/
│   │   ├── factories/         # Kafka broker factory
│   │   └── middleware/        # Auth & error handler middleware
│   ├── config/                # DB, logger, Kafka connections
│   ├── coupon/                # Coupon CRUD & verification
│   ├── customer/              # Customer profile & addresses
│   ├── idempotency/           # Idempotency model (TTL-backed)
│   ├── order/                 # Order creation & types
│   ├── productCache/          # Cached product pricing (populated via Kafka)
│   ├── toppingCache/          # Cached topping pricing (populated via Kafka)
│   └── types/                 # Shared TypeScript interfaces
├── server.ts                  # Entry point
└── app.ts                     # Express app setup
```

## Configuration

Config files in `config/` use node-config with YAML. Key values:

| Key | Description |
|---|---|
| `server.port` | Listen port |
| `database.url` | MongoDB connection string (use `retryWrites=false` for standalone) |
| `auth.jwksUri` | JWKS endpoint for JWT verification |
| `kafka.broker` | Kafka broker address |

### MongoDB

Make sure your connection string includes `retryWrites=false` when connecting to a standalone MongoDB instance:

```yaml
database:
  url: mongodb://root:root@localhost:27017/order_db?authSource=admin&w=1&retryWrites=false
```

## API Endpoints

All endpoints (except health check) require JWT authentication via `Authorization: Bearer <token>` header or `accessToken` cookie.

### Health

```
GET /
```

Response: `{ "message": "Hello from order service service!" }`

### Orders

```
POST /orders
```

Creates a new order. Supports idempotency via the `idempotency-key` header.

**Request body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `cart` | `CartItem[]` | Yes | Array of cart items with chosen configurations |
| `address` | `string` | Yes | Delivery address |
| `customerId` | `string` | Yes | Customer ObjectId |
| `tenantId` | `string` | Yes | Tenant identifier |
| `paymentMode` | `"card" \| "cash"` | Yes | Payment method |
| `couponCode` | `string` | No | Coupon code for discount |
| `comment` | `string` | No | Order comment |

**Headers:**

| Header | Value | Description |
|---|---|---|
| `idempotency-key` | `string` | Unique key to prevent duplicate order creation |

**Response:** `201 Created` with the created order document. Returns cached response on duplicate requests.

### Coupons

```
POST /coupons
```

Create a new coupon.

```
POST /coupons/verify
```

Verify a coupon code and return discount details.

### Customers

```
GET /customer
```

Get the authenticated customer's profile.

```
PATCH /customer/addresses/:id
```

Add or update an address for the customer.

## Idempotency

The `POST /orders` endpoint uses an **idempotency-key** header to prevent duplicate order creation:

1. Send a unique `idempotency-key` header with each order request
2. If the key hasn't been seen, the order is created and the result is cached
3. If the same key is used again, the cached order response is returned immediately (no new order is created)

Idempotency records are stored in MongoDB with a TTL index for automatic cleanup (default: 20s — configured per environment).

## Kafka Integration

The service subscribes to `product` and `topping` Kafka topics to maintain local caches of pricing data:

| Topic | Handler | Purpose |
|---|---|---|
| `product` | `handleProductUpdate` | Updates `productCache` collection |
| `topping` | `handleToppingUpdate` | Updates `toppingCache` collection |

The consumer uses the group ID `order-service` and connects to the broker configured in `kafka.broker`.

## Error Format

All errors are returned in a consistent format:

```json
{
  "errors": [
    {
      "ref": "uuid",
      "type": "ErrorType",
      "msg": "Human-readable message",
      "path": "/orders",
      "location": "server",
      "stack": "..." (only in non-production)
    }
  ]
}
```
