## Repository Status & Roadmap

### Current Feature Set
- API key issuance + validation
- Stripe subscription + tier update via webhooks
- Daily + monthly rate limiting
- Basic usage logging
- Sample dataset with private full dataset hook

### Near-Term Enhancements (Suggested)
Priority | Feature | Notes
-------- | ------- | -----
High | DB-backed search | Move awards to Postgres for filtered queries
High | Key hashing pepper | Add `API_KEY_SECRET` usage
Medium | Expanded metrics | Response time & error rate logging
Medium | Admin dashboard auth | Protect /dashboard via signed token
Low | XML output | OMDB compatibility style
Low | Edge cache hints | Possibly add ETag support

### Technical Debt
- Duplicate subscription endpoint variants (consider consolidation)
- Limited test coverage (only basic smoke)

### Release Cadence
Manual; update `VERSION` + `CHANGELOG.md` per customer distribution.

End.