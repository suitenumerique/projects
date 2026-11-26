# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.4.0] - 2026-11-26

### Added

- Favorite boards
- Mention board members in comments and notify them
- Personal API tokens (30 or 90 days lifetime)
- Email notification preferences: choose which events send an email
- Email notifications for card moves, description changes and assignments
- Assignments shown in the card activity thread
- Leave board action
- Optional Redis adapters for horizontal scaling
- OIDC logout
- Default header logo and favicon based on color scheme

### Fixed

- Board owners can delete any comment on their board
- Viewers who cannot comment can still see comments and activities
- Commenter role unable to create comments
- Board owner unable to change their own rights
- Lists scroll on touch devices instead of dragging cards
- Popovers not closing in turn
- Folders disappearing after inactivity or page reload
- Boards disappearing when their folder is deleted
- Access to the organization project when it has no board
- Boards list in the move board window
- Activities display in the card modal and links in notifications
- Custom favicon not applied on every route
- Default language and locale loading on the login screen
- Default S3 region for custom endpoints

### Changed

- Move card popover redesigned as a step-by-step menu
- Email notification settings redesigned
- Board rename and delete restricted to owners
- UI kit upgraded to 0.28.1 and Cunningham React to 4.4.0

### Security

- Stored XSS via attacker-chosen attachment extension
- Source board authorization check when duplicating a board
- Upgrade server dependencies with known vulnerabilities (bcrypt 6, nodemailer 10, sharp 0.35, express, socket.io, ws, lodash, validator)
- Upgrade client dependencies with known vulnerabilities (axios, js-cookie, lodash, nanoid, react-router-dom, js-yaml)
- Node.js security release and production image CVE fixes

## [1.3.0] - 2026-05-28

### Added

- Export boards data to CSV
- Include active filters in URL (shareable filter state)
- Folder deletion
- Configurable organization ID claim for OIDC project auto-assignment

### Fixed

- Display issue with long board names
- Duplicated user in share modal
- Cmd+Enter incorrectly opening card on Mac
- Notifications read button
- Comments not rendered as markdown

### Changed

- Harmonised board actions UI
- Improved drag-and-drop and rendering performance

## [1.2.0] - 2026-02-06

### Added

- Count badge on list headers
- Automatically assign filtered members and labels to created cards
- Display all activities by default and make them hideable

### Fixed

- Various interactions on the card modal

### Changed

- UI kit fixes

## [1.1.0] - 2026-02-03

### Added

- Kit UI v2 migration
- User search on-demand for better performance and privacy

### Fixed

- Shared boards display in left menu
- XSS vulnerability from react-photoswipe-gallery
- User emails now masked on public boards when not logged in
- Node upgrade issues
- Attachment popup removed
- ESLint config extending from another package.json

### Changed

- Removed pnpm in favor of npm for simplicity
- Aligned node versions across environments
- Cleaned up package-lock.json and added async overrides

## [1.0.1] - 2025-11-25

### Added

- ✨ (frontend) add no member/label option in filters

### Fixed

- 💄 (frontend) Improve filters UI
- 🐛(frontend) Switched to pointer collision strategy
- 🐛 (header) fix posthog identification by using window.posthog
- ✨ (frontend) add i18n support to Cunningham

### Changed

- 📝 Update README
