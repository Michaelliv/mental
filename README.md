# Mental Model

> The mental model layer for agent-written code

## The Problem

Agents write code faster than humans can build mental models of it. Code appears without the understanding developers naturally form over months of working in a codebase.

Code has semantics—that's what compilers read. But code lacks the **mental model**: the understanding of what the system is about, how it works, and why decisions were made.

## The Solution

Agents externalize the mental model as they code. They document:

- **Domains** — what the system is about (User, Order, Invoice)
- **Capabilities** — what the system does (Checkout, Onboarding, Search)
- **Aspects** — what applies across (Auth, Validation, Retry)
- **Decisions** — why things are the way they are

Humans explore this via a visual graph. The mental model stays available even when code was written by an agent.

## Schema

```yaml
domains:
  Order:
    description: A purchase transaction
    references: [User]
    files: [src/models/order.ts, src/types/order.ts]
    decisions:
      - Soft deletes instead of hard deletes
      - Prices stored in cents to avoid float issues

capabilities:
  Checkout:
    description: Completes a purchase
    operates_on: [User, Order]
    composes: [Payment, Inventory]
    files: [src/flows/checkout.ts, src/api/checkout.ts]
    decisions:
      - Inventory reserved before payment, released on failure
      - Guest checkout creates anonymous User record

aspects:
  Auth:
    description: Authentication and authorization
    applies_to:
      capabilities: [Checkout, AccountSettings]
    files: [src/middleware/auth.ts, src/lib/session.ts]
    decisions:
      - JWT with 15min expiry, refresh tokens in httpOnly cookies
```

## Usage

```bash
# Install
npm install -g @mentalmodel/cli

# Add domains
mental add domain Order --references User

# Add capabilities
mental add capability Checkout --operates-on Order,User

# Add aspects
mental add aspect Auth --applies-to Checkout

# View the model
mental show

# Open graph view
mental graph
```

## Visualization

Three horizontal layers. Lines flow downward.

```
┌─────────────────────────────────┐
│  Aspects                        │  ← governs
├─────────────────────────────────┤
│  Capabilities                   │  ← acts on
├─────────────────────────────────┤
│  Domains                        │  ← foundation
└─────────────────────────────────┘
```

Click any node to see: description, related files, decisions, connections.

Filter by: "show me everything that touches Order" or "what did the agent add this week?"

## How It Works

1. Agent writes code
2. Agent updates the mental model (new domain, new capability, decision made)
3. Human explores the graph
4. Human stays in control

The mental model is the contract between agent speed and human understanding.

## Status

🚧 **In Development** - Coming soon

## Links

- Website: [mentalmodel.sh](https://mentalmodel.sh)
- npm: [@mentalmodel/cli](https://www.npmjs.com/package/@mentalmodel/cli)
- GitHub: [mentalmodel-sh/mental](https://github.com/mentalmodel-sh/mental)

## License

MIT
