# ADR 0001 — Record architecture decisions here

## Status

Accepted

## Context

Hackathon prototype with multiple agents/teammates. Need a lightweight ADR trail plus authoritative docs under `docs/`.

## Decision

1. Keep **canonical** product/API/schema docs under `docs/` (`UPPER_SNAKE_CASE.md`).
2. Keep ADCE software-eng stubs at repo root (`requirements/`, `design/`, `architecture/`, …) as **indexes** that link to `docs/` — do not fork conflicting requirements.
3. Record significant stack/scope choices in [docs/requirements/SCOPE_DECISIONS.md](../docs/requirements/SCOPE_DECISIONS.md) and as ADRs under `decisions/` when they affect architecture.

## Consequences

Agents must update `docs/` first for contract changes, then refresh root ADCE indexes if summaries drift.
