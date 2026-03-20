# Contributing

## Setup

```bash
npm install
```

## Validation

Run all checks before opening a PR:

```bash
npm run check
npm test
npm run build
```

## Scope

This library **currently** targets TRIAS `1.2` only.

Please avoid changes that silently broaden version support without explicit tests and documentation updates.

## Guidelines

- keep the public API small and explicit
- prefer typed wrappers for high-value endpoints
- keep generic request support available for the long tail of TRIAS request families
- add tests for request building and response parsing changes
