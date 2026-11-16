# Environment Variables

This document lists the environment variables supported by Projets.

For a working starting point, see [`server/.env.sample`](./server/.env.sample) (local/Node.js setup) or [`docker-compose.yml`](./docker-compose.yml) / [`docker-compose-dev.yml`](./docker-compose-dev.yml) (Docker setups).

## Server

### Required

| Variable       | Description                                                                                                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BASE_URL`     | Public URL of the application (e.g. `https://projects.example.com`). Used to build absolute links (emails, webhooks, OIDC redirect/logout URIs) and to derive the base path/protocol. |
| `DATABASE_URL` | PostgreSQL connection string (e.g. `postgresql://user:password@host:5432/db`).                                                                                                        |
| `SECRET_KEY`   | Secret used to sign session cookies. Use a long, random value in production. When running multiple replicas, they must all share the **same** value (see [Horizontal scaling](#horizontal-scaling-multiple-instances-optional)).                     |

### Core / general

| Variable                                   | Default                   | Description                                                                                                                                                                                                                                                                        |
| ------------------------------------------ | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`                                 | –                         | Node environment (`development`, `production`, `test`). Set automatically in most setups.                                                                                                                                                                                          |
| `LOG_FILE`                                 | `<cwd>/logs/projects.log` | Path to the log file.                                                                                                                                                                                                                                                              |
| `TRUST_PROXY`                              | unset (falsy)             | Set to a truthy value when running behind a reverse proxy, so client IPs are read from `X-Forwarded-For`.                                                                                                                                                                          |
| `TOKEN_EXPIRES_IN`                         | `365`                     | Auth token lifetime, in days.                                                                                                                                                                                                                                                      |
| `SHOW_DETAILED_AUTH_ERRORS`                | `false`                   | Set to `true` to return more detailed authentication error messages. **Do not enable without a rate limiter** — it makes credential/user enumeration easier.                                                                                                                       |
| `ALLOW_ALL_TO_CREATE_PROJECTS`             | `false`                   | Set to `true` to let any authenticated user create projects (not just admins).                                                                                                                                                                                                     |
| `ORGANIZATION_ID_CLAIM`                    | unset (free mode)         | Name of the OIDC claim used to auto-assign users as manager of the matching project (e.g. `siret`). When set, "org mode" is enabled; when unset, users freely create/manage their own projects.                                                                                    |
| `STATS_API_TOKEN`                          | unset                     | Bearer token required to access the stats API.                                                                                                                                                                                                                                     |
| `DISABLE_INDEXING`                         | `false`                   | Set to `true` to disallow search engine indexing via `robots.txt`.                                                                                                                                                                                                                 |
| `DATABASE_SCHEMA`                          | –                         | PostgreSQL schema to use, if not the default one.                                                                                                                                                                                                                                  |
| `PGSSLMODE`                                | –                         | Read directly by the `pg` driver to configure the SSL mode of the database connection (knex doesn't read this from the connection string, see [knex#2354](https://github.com/knex/knex/issues/2354)).                                                                              |
| `KNEX_REJECT_UNAUTHORIZED_SSL_CERTIFICATE` | `true`                    | Set to `false` to accept self-signed/unauthorized SSL certificates on the database connection (used by migrations/seeds run through knex).                                                                                                                                         |
| `TZ`                                       | –                         | Server timezone (e.g. `UTC`).                                                                                                                                                                                                                                                      |
| `THEME_PREFIX`                             | `''` (recommended)        | White-label by default — leave unset. The only other value actually used by this project, `dsfr`, opts into its built-in government preset (color palette, font, and extra branding elements); not needed for a self-hosted deployment.                                           |
| `DISABLE_DARK_MODE`                        | `''`                      | Set to `true` to disable dark mode in the UI.                                                                                                                                                                                                                                      |
| `SERVICE_NAME`                             | `Projets`                 | Display name of the service: browser tab title, meta description, and the "Ouvrir {name}" wording / logo `alt` text in outgoing emails. See [Self-hosted branding](#self-hosted-branding).                                                                                       |
| `THEME`                                    | built-in default theme    | JSON string overriding branding: favicon, header/footer logos, colors, font, gaufre widget, feedback widget... See [`server/config/default-theme.json`](./server/config/default-theme.json), the `ThemeSchema` in [`server/config/custom.js`](./server/config/custom.js), and [Self-hosted branding](#self-hosted-branding) below.                                                                                                                                                                                                                                              |
| `DEFAULT_LANGUAGE`                         | unset                     | Default interface language (e.g. `fr-FR`).                                                                                                                                                                                                                                         |
| `SUPPORTED_LANGUAGES`                      | unset (all)               | Comma-separated list of enabled interface languages (e.g. `fr-FR,en-US`).                                                                                                                                                                                                          |
| `TEMPLATE_BOARDS`                          | `[]`                      | JSON array of template boards proposed at board creation.                                                                                                                                                                                                                          |

### Default admin user

Used when seeding the database (`npm run db:init` / `db/seeds/default.js`). `DEFAULT_ADMIN_EMAIL` must be kept set if you want to prevent that user from being edited/deleted.

| Variable                 | Description                            |
| ------------------------ | -------------------------------------- |
| `DEFAULT_ADMIN_EMAIL`    | Email of the seeded admin user.        |
| `DEFAULT_ADMIN_PASSWORD` | Password of the seeded admin user.     |
| `DEFAULT_ADMIN_NAME`     | Display name of the seeded admin user. |
| `DEFAULT_ADMIN_USERNAME` | Username of the seeded admin user.     |

### Object storage (S3), optional

Only needed to store attachments/avatars/backgrounds on an S3-compatible bucket instead of local disk.

| Variable               | Description                                                                |
| ---------------------- | -------------------------------------------------------------------------- |
| `S3_ENDPOINT`          | S3-compatible endpoint URL.                                                |
| `S3_REGION`            | Bucket region.                                                             |
| `S3_ACCESS_KEY_ID`     | Access key ID.                                                             |
| `S3_SECRET_ACCESS_KEY` | Secret access key.                                                         |
| `S3_BUCKET`            | Bucket name.                                                               |
| `S3_FORCE_PATH_STYLE`  | Set to `true` for endpoints that require path-style requests (e.g. MinIO). |

### Horizontal scaling (multiple instances), optional

Only needed when running **more than one** instance/process behind a load balancer. By default the app keeps sessions in memory and broadcasts realtime socket events per-process, so a second instance would not receive the live updates emitted by the first. Setting `REDIS_URL` shares both sessions and socket.io broadcasts through Redis (via `@sailshq/connect-redis` and `@sailshq/socket.io-redis`), which is required for the realtime collaboration to work across instances. Only applied in production (`NODE_ENV=production`).

All replicas must sit behind a load balancer that forwards to each instance's app port (`1337`) and share the **same `SECRET_KEY`**: session ID cookies are signed with it, so a cookie issued by one instance is only accepted by the others when the secret matches. They must likewise share the same `DATABASE_URL` and `REDIS_URL`. (How the balancer reaches that port — a published host port vs. the container directly — depends on your deployment; see [`docker-compose.yml`](./docker-compose.yml) for the Docker topology.)

To scale out you must **also** move file storage off local disk to [S3](#object-storage-s3-optional) — otherwise attachments/avatars/backgrounds uploaded on one instance are not visible from the others.

| Variable    | Default | Description                                                                                            |
| ----------- | ------- | ----------------------------------------------------------------------------------------------------- |
| `REDIS_URL` | unset   | Redis connection string (e.g. `redis://user:password@host:6379/0`). Enables shared sessions + sockets. |

### OpenID Connect (OIDC)

| Variable                            | Default                 | Description                                                                                      |
| ----------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------ |
| `OIDC_ISSUER`                       | –                       | Issuer URL of the OIDC provider.                                                                 |
| `OIDC_CLIENT_ID`                    | –                       | OIDC client ID.                                                                                  |
| `OIDC_CLIENT_SECRET`                | –                       | OIDC client secret.                                                                              |
| `OIDC_ID_TOKEN_SIGNED_RESPONSE_ALG` | provider default        | Expected signing algorithm for the ID token.                                                     |
| `OIDC_USERINFO_SIGNED_RESPONSE_ALG` | provider default        | Expected signing algorithm for the userinfo response.                                            |
| `OIDC_SCOPES`                       | `openid email profile`  | Space-separated OIDC scopes requested.                                                           |
| `OIDC_RESPONSE_MODE`                | `fragment`              | OIDC response mode, used only if `OIDC_USE_DEFAULT_RESPONSE_MODE` is not `true`.                 |
| `OIDC_USE_DEFAULT_RESPONSE_MODE`    | `false`                 | Set to `true` to let the provider use its default response mode instead of `OIDC_RESPONSE_MODE`. |
| `OIDC_ADMIN_ROLES`                  | `[]`                    | Comma-separated list of roles (from `OIDC_ROLES_ATTRIBUTE`) granted admin access.                |
| `OIDC_CLAIMS_SOURCE`                | `userinfo`              | Where to read claims from (e.g. `userinfo` or the ID token).                                     |
| `OIDC_EMAIL_ATTRIBUTE`              | `email`                 | Claim used as the user's email.                                                                  |
| `OIDC_FULLNAME_ATTRIBUTES`          | `given_name,usual_name` | Comma-separated claims concatenated to build the user's full name.                               |
| `OIDC_USERNAME_ATTRIBUTE`           | `preferred_username`    | Claim used as the user's username, unless `OIDC_IGNORE_USERNAME` is set.                         |
| `OIDC_ROLES_ATTRIBUTE`              | `groups`                | Claim used to read the user's roles (see `OIDC_ADMIN_ROLES`).                                    |
| `OIDC_IGNORE_USERNAME`              | `false`                 | Set to `true` to ignore `OIDC_USERNAME_ATTRIBUTE` and derive the username otherwise.             |
| `OIDC_IGNORE_ROLES`                 | `false`                 | Set to `true` to ignore roles from the provider.                                                 |
| `OIDC_ENFORCED`                     | `false`                 | Set to `true` to require OIDC login (disables other login methods).                              |
| `OIDC_POST_LOGOUT_REDIRECT_URI`     | `BASE_URL`              | Where the provider redirects the user after logout.                                              |

### Email notifications (SMTP)

Optional; see [Nodemailer SMTP docs](https://nodemailer.com/smtp/). Notifications are silently skipped if `SMTP_HOST` is unset.

| Variable                       | Default | Description                                                                                |
| ------------------------------ | ------- | ------------------------------------------------------------------------------------------ |
| `SMTP_HOST`                    | unset   | SMTP server host.                                                                          |
| `SMTP_PORT`                    | `587`   | SMTP server port.                                                                          |
| `SMTP_NAME`                    | –       | `name` option passed to the SMTP transport (client identification, e.g. HELO/EHLO).        |
| `SMTP_SECURE`                  | `false` | Set to `true` to use TLS from the start of the connection.                                 |
| `SMTP_USER`                    | –       | SMTP auth username.                                                                        |
| `SMTP_PASSWORD`                | –       | SMTP auth password.                                                                        |
| `SMTP_FROM`                    | –       | `From` header used on outgoing emails (e.g. `"Demo Demo" <demo@demo.demo>`).               |
| `SMTP_TLS_REJECT_UNAUTHORIZED` | `true`  | Set to `false` to accept self-signed/unauthorized TLS certificates on the SMTP connection. |

### Webhooks, optional

| Variable   | Description                                                                                                                                                                                              |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `WEBHOOKS` | JSON array of webhook definitions, each with `url` (required), and optional `accessToken`, `events` (allow-list), `excludedEvents` (deny-list). Example in [`server/.env.sample`](./server/.env.sample). |

### Self-hosted branding

A default deployment already ships white-label, with a neutral look and no extra branding elements — there's nothing to configure to get that. To customize it further:

| Variable | What it does |
| --- | --- |
| `SERVICE_NAME` | Renames the service across the browser tab title, meta description, and outgoing emails. Defaults to "Projets". Doesn't rename on-disk assets like `client/public/manifest.json`'s app name, which stays static. |
| `THEME` | A JSON blob for branding. Relevant fields: |

- `theme.colors` — a map of Cunningham CSS custom-property names to override values, e.g. `THEME='{"colors":{"--c--globals--colors--brand-500":"#123456"}}'`. See [`client/src/assets/styles/cunningham-tokens.css`](./client/src/assets/styles/cunningham-tokens.css) for the full list of available names (colors live under `--c--globals--colors--*` and `--c--contextuals--*`).
- `theme.fontFamily` — a CSS font-family value, e.g. `THEME='{"fontFamily":"Arial, sans-serif"}'`. This only sets the CSS declaration — the app doesn't fetch/host third-party font files for you (Hanken Grotesk is self-hosted by default, anything else here isn't), so use a web-safe font or self-host your own `@font-face` separately.
- `theme.favicon` (`{src, darkSrc?}`) — the browser tab icon.
- `theme.header.{default,fr,en}.logo` (`{src, width?, height?, alt}`) — the header logo; falls back to this app's own bundled "Projets" logo when unset.

## Client

These apply when building/running the client (see [`client/.env.local`](./client/.env.local) for local overrides).

| Variable                    | Description                                                                                                                                                                     |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `REACT_APP_SERVER_BASE_URL` | Base URL the client uses to reach the server API, when different from `BASE_URL` (useful in the Docker dev setup, where client and server run on different internal addresses). |
| `THEME_PREFIX`              | Same as the server-side variable above; also consumed at client build time (see [`client/config-overrides.js`](./client/config-overrides.js)) so both should be kept in sync.   |
| `NODE_ENV`                  | Standard React/CRA environment (`development`, `production`, `test`).                                                                                                           |
| `CHOKIDAR_USEPOLLING`       | Set to `true` to enable filesystem polling for hot-reload (needed in some Docker setups, e.g. on macOS/Windows bind mounts).                                                    |
