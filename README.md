# Mental Model

> Don't become a stranger in your own codebase.

```bash
npm install -g @mentalmodel/cli
```

## The Problem

Agents write your code now. Features ship fast. But something is slipping away.

When **you** write code, understanding comes free. You build the mental model as you build the software. You know what's there because you put it there.

When **agents** write code, the code appears, but the understanding doesn't transfer. You read it, you approve it, you ship it. But you didn't *build* it. And slowly, you become a stranger in your own codebase.

You open a file and don't recognize it. You can't explain your system without asking the agent. You approve PRs you don't fully understand. You feel productive, but secretly lost.

**The mental model you would have built, if you'd written it yourself, is missing.**

## The Solution

Externalize the mental model. Make it visible. Keep it updated as code evolves.

- **Domains**: the nouns of your system (User, Order, Payment)
- **Capabilities**: the verbs (Checkout, ProcessRefund, SendNotification)
- **Aspects**: the cross-cutting concerns (Auth, Validation, Retry, Audit)
- **Decisions**: the why behind the what

This isn't documentation for others. It's **your understanding**, stored outside your head so you don't have to carry it all.

```
┌─────────────────────────────────────────────────────────────────────┐
│  DOMAINS            │  CAPABILITIES        │  ASPECTS              │
│  (what exists)      │  (what it does)      │  (how it's governed)  │
├─────────────────────┼──────────────────────┼───────────────────────┤
│  □ Order            │  ◇ Checkout          │  ○ Auth               │
│  □ User             │  ◇ ProcessPayment    │  ○ Validation         │
│  □ Payment          │  ◇ SendNotification  │  ○ Retry              │
│  □ Product          │  ◇ TrackShipment     │  ○ Audit              │
└─────────────────────┴──────────────────────┴───────────────────────┘
```

## Why This Matters

**Without a mental model tool:**
- You supervise agents but understanding atrophies
- You become dependent on agents to explain your own code
- You can't onboard others or explain the system
- You feel productive but secretly lost
- Crisis: "Am I even an engineer anymore?"

**With a mental model tool:**
- You supervise agents while maintaining understanding
- You can answer questions without asking the agent
- You can explain the system to anyone in minutes
- You feel both productive AND competent
- You're the architect. Agents are your builders.

## Usage

```bash
# Add a domain
mental add domain Order --desc "A purchase transaction" --refs User

# Add a capability
mental add capability Checkout --desc "Completes a purchase" --operates-on Order,User

# Add an aspect
mental add aspect Auth --desc "Authentication and authorization" --applies-to Checkout

# Record a decision with documentation
mental add decision "Use Stripe for payments" \
  --why "Proven reliability, great DX" \
  --relates-to "domain:Order,capability:Checkout" \
  --docs "docs/adr/payments.md,https://stripe.com/docs"

# Supersede a decision when things change
mental supersede decision dec-123 \
  --what "Switch to Adyen for payments" \
  --why "Better international coverage"

# See what you know
mental show

# Visualize your understanding
mental view

# Publish to GitHub Pages
mental publish
```

## The Visualization

Three columns. Your vocabulary. Click to explore connections.

Hover to see what's related. Click to lock the highlight and see details. Connections light up across columns so you can trace relationships.

Click on a decision to open the decision viewer. See the rationale, context, and linked documentation rendered inline. Local markdown files display beautifully; external URLs open in new tabs.

This is how you stay oriented. How you remember. How you stay the expert on your own system.

## How It Works

1. Agents write code, make decisions, add features
2. The mental model captures what was built and why
3. You explore visually, reinforcing your understanding
4. You stay competent to supervise, direct, and architect

The mental model is the understanding you would have built if you'd written it yourself.

## Philosophy

This tool exists because of a belief:

**Developers shouldn't become strangers in their own codebases.**

Agents are fast. Agents are capable. But speed without understanding is dangerous. You need to stay in the loop, not as a rubber stamp, but as the architect who truly knows their system.

The mental model is permission to forget the details, because you can always look them up. It's cognitive relief. It's how you scale your understanding alongside the code.

You don't have to hold it all in your head anymore. That's what this is for.

## Status

🚧 **In Development**

## Links

- Website: [mentalmodel.sh](https://mentalmodel.sh)
- GitHub: [Michaelliv/mental](https://github.com/Michaelliv/mental)

## License

MIT
