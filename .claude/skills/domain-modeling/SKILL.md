---
name: domain-modeling
description: Guide the creation of a high-quality mental model for a codebase. Use when starting a new mental model, when the model feels incomplete or unclear, or when onboarding to understand a system's architecture. Produces domains, capabilities, aspects, and architectural decisions.
---

# Domain Modeling Guide

Create a mental model that captures how a system *actually works* - not just what files exist, but the conceptual boundaries, responsibilities, and decisions that shape it.

## Philosophy

A good domain model answers:
- "What are the core *things* this system deals with?" → **Domains**
- "What can this system *do*?" → **Capabilities**
- "What concerns cut *across* multiple parts?" → **Aspects**
- "Why was it built *this way*?" → **Decisions**

## Process

### 1. Explore Before Modeling

Don't start by naming entities. Start by understanding:

```
Questions to investigate:
- What problem does this system solve?
- Who are the users/actors?
- What are the key user journeys?
- Where does data come from and go to?
- What would break if you deleted random files?
```

Read the README, entry points, and configuration first. Trace one complete flow through the system.

### 2. Find the Domains (Nouns)

Domains are the core *things* the system knows about. They have identity and lifecycle.

**Good domains:**
- Have clear boundaries ("this is a User, that is a Session")
- Are spoken about by stakeholders (ubiquitous language)
- Would exist even if you rewrote the code

**Anti-patterns:**
- "Utils" or "Helpers" - these aren't domains, they're code organization
- "Data" or "Info" - too generic
- Implementation details ("RedisCache", "PostgresStore")

**Test:** Can you explain this domain to a new team member without showing code?

### 3. Find the Capabilities (Verbs)

Capabilities are what the system *does*. They operate on domains.

**Good capabilities:**
- Describe behavior, not structure
- Have clear inputs and outputs
- Could be triggered by a user action or event

**Pattern:** `[Capability] operates on [Domain, Domain, ...]`

Examples:
- "Authentication operates on User, Session"
- "OrderFulfillment operates on Order, Inventory, Shipment"

**Anti-patterns:**
- "UserService" - too vague, what does it *do*?
- "CRUD operations" - that's implementation, not capability

### 4. Find the Aspects (Cross-cutting Concerns)

Aspects apply *across* multiple domains or capabilities.

**Good aspects:**
- Affect behavior of multiple capabilities
- Often implemented as middleware, decorators, or conventions
- Are "-ilities": security, reliability, observability

Examples:
- "Caching applies to [ProductCatalog, UserProfile]"
- "RateLimiting applies to [Authentication, API]"
- "AuditLogging applies to [all capabilities]"

### 5. Capture Decisions (The Why)

Decisions record *why* the system is shaped this way.

**Good decisions answer:**
- What was decided?
- Why was it decided? (constraints, trade-offs)
- What entities does it affect?

**Template:**
```
WHAT: Use JWT tokens with 15-minute expiry
WHY: Balance security (short-lived) with UX (not too frequent refresh)
AFFECTS: User, Session, Authentication
```

**When to record a decision:**
- "We chose X over Y because..."
- "This is weird because..."
- "Future maintainers should know..."

## Quality Checklist

Before considering the model complete:

- [ ] **Coverage**: Every significant file maps to at least one entity
- [ ] **No orphans**: Every domain is operated on by at least one capability
- [ ] **Clear language**: A new team member could understand each entity name
- [ ] **Relationships exist**: Domains reference each other, capabilities operate on domains
- [ ] **Decisions captured**: At least 3 architectural decisions documented
- [ ] **Not too granular**: 4-8 domains is typical, not 20+
- [ ] **Not too abstract**: Entities map to real code, not theoretical concepts

## Output Format

For each entity, provide:

**Domain:**
```
Name: [PascalCase noun]
Description: [What it represents, its lifecycle, key attributes]
References: [Other domains it relates to]
Files: [Key files that implement this domain]
```

**Capability:**
```
Name: [PascalCase verb phrase]
Description: [What it does, when it's triggered]
Operates On: [Domains it works with]
Files: [Key files that implement this capability]
```

**Aspect:**
```
Name: [PascalCase concern]
Description: [What cross-cutting concern it addresses]
Applies To: [Capabilities and/or domains it affects]
Files: [Where it's implemented]
```

**Decision:**
```
What: [The decision made]
Why: [Rationale and trade-offs]
Relates To: [Affected domains, capabilities, aspects]
```

## Common Mistakes

1. **Modeling the code, not the domain**
   - Bad: "Controllers", "Services", "Repositories"
   - Good: "User", "Order", "Payment"

2. **Too many entities**
   - If you have 15+ domains, you're modeling at the wrong level
   - Combine related concepts, use aspects for cross-cutting

3. **No relationships**
   - Entities should connect; orphan entities suggest wrong boundaries

4. **Skipping decisions**
   - The model shows *what*, decisions show *why*
   - Without decisions, the model loses half its value

5. **Modeling aspirations**
   - Model what *is*, not what you wish it was
   - Use decisions to note "we should change X"
