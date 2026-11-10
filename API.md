# API

Projects exposes a REST API under `/api` (see `server/config/routes.js` for the full list of routes).
To call it from a script or a third-party tool, use a **personal API token**.

## Getting a token

In the app: **User profile → API token**, choose an expiration, then click **Generate token**.
The token (`prj_…`) is shown **only once**: copy it right away. Only its hash is stored.

A token:

- acts **on behalf of its owner**, with exactly the same rights as the owner on projects and boards;
- can be revoked at any time from the same screen;
- is automatically invalidated if it expires, if the owner changes their password, or if the account is deleted;
- **cannot** manage credentials: creating or revoking API tokens, or changing the password, email or username,
  requires a browser session (`403` otherwise);
- can **read** users (`GET /api/users/me`, `GET /api/users/:id`, `GET /api/users/search`) but **never modify them**:
  creating, updating (profile, avatar, admin role) or deleting a user requires a browser session, even for an admin
  (`403` otherwise).

Each user has **one** token at a time: to get a new one, revoke the current token first, then generate a new one.

## Usage

Send the token in the `Authorization` header:

```sh
export PROJECTS_URL=https://projects.example.gouv.fr
export PROJECTS_TOKEN=prj_xxxxxxxxxxxxxxxx

# Current user
curl -H "Authorization: Bearer $PROJECTS_TOKEN" "$PROJECTS_URL/api/users/me"

# Projects and boards visible to the user
curl -H "Authorization: Bearer $PROJECTS_TOKEN" "$PROJECTS_URL/api/projects"

# A board with its lists, cards, labels, memberships…
curl -H "Authorization: Bearer $PROJECTS_TOKEN" "$PROJECTS_URL/api/boards/<boardId>"

# Create a card in a list
curl -X POST -H "Authorization: Bearer $PROJECTS_TOKEN" -H "Content-Type: application/json" \
  -d '{"name": "New card", "position": 65535}' \
  "$PROJECTS_URL/api/lists/<listId>/cards"

# Move a card to another list
curl -X PATCH -H "Authorization: Bearer $PROJECTS_TOKEN" -H "Content-Type: application/json" \
  -d '{"listId": "<otherListId>", "position": 65535}' \
  "$PROJECTS_URL/api/cards/<cardId>"
```

Changes made through the API are broadcast in real time to users who have the board open.

## Rate limits

Each token can make up to **300 read requests** (`GET`) and **60 write requests** (`POST`, `PATCH`, `DELETE`)
per minute (configurable with `API_TOKEN_RATE_LIMIT_READ` / `API_TOKEN_RATE_LIMIT_WRITE`). Every response carries
`RateLimit-Limit`, `RateLimit-Remaining` and `RateLimit-Reset` (seconds) headers. Beyond the limit, the API answers
`429 Too Many Requests` with a `Retry-After` header: wait that many seconds before retrying.
