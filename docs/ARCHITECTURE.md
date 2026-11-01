# FindIn Architecture

FindIn uses a modular monolith with feature-based organization and Clean Architecture boundaries.

```text
React UI
  ↓ HTTP/JSON
Express routes/controllers
  ↓
Application services/use cases
  ↓
Domain rules and repository interfaces
  ↓
Prisma repositories
  ↓
PostgreSQL
```

Routes translate HTTP requests. Controllers coordinate requests. Application services contain use cases. Domain code contains business rules. Repositories hide database details.

Initial modules:

- `auth`: registration, login, sessions, authentication middleware
- `users`: developer profiles and visibility
- `projects`: project-card CRUD and metadata
- `matching`: developer/project filtering and matching rules
- `invitations`: applications, invitations, and status transitions
