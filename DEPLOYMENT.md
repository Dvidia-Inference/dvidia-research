# Research site release

The static site has a dedicated Cloudflare Worker, `dvidia-research`, serving only `research.dvidia.org`. The configuration has no application bindings and does not modify the main DVIDIA Worker. Custom Domains manages the hostname's DNS and certificate.

Build and review before releasing:

```sh
npm ci --ignore-scripts
npm run check
npm test
node scripts/cloudflare-release.mjs dry-run
```

Merge reviewed source and generated `docs/` output to `main`, then deploy the same revision:

```sh
node scripts/cloudflare-release.mjs deploy
node scripts/cloudflare-release.mjs status
```

The release helper uses the existing local DVIDIA Cloudflare credential, verifies the account and exact hostname, and passes the token only to Wrangler's process environment. Do not add credentials to this repository. Wrangler 4.112.0 was used for this release; Node 22 runs the site generator. Research readers have no hosted API or external font dependency.

Verify HTTPS for the journal, a paper, its Markdown download and RSS. Check that a nonexistent path returns 404 and that a paper is readable without JavaScript. Record the deployed version ID separately from source evidence. Rollback uses Wrangler's version rollback for this dedicated Worker; review its current version history first. A rollback must not target the main `dvidia` Worker.
