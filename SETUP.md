# GolfTevora Cloudflare setup

This version removes FormSubmit completely. The site, waitlist API, feedback API, storage, and notification email all run on Cloudflare.

1. In Cloudflare, create a Workers KV namespace (for example `golftevora-data`). Copy its namespace ID and replace `REPLACE_WITH_YOUR_KV_NAMESPACE_ID` in `wrangler.jsonc`.
2. In Cloudflare **Email Service > Email Sending**, onboard `golftevora.com`. Cloudflare will add the required sending DNS records.
3. Make sure `golftevora@gmail.com` is a verified destination in Cloudflare Email Service / Email Routing.
4. Push these files to the GitHub repo and deploy as a Cloudflare Worker using the included `wrangler.jsonc`.
5. Point the existing `golftevora.com` custom domain at this Worker (Workers > your Worker > Settings > Domains & Routes > Add > Custom Domain).
6. Test both Notify Me and Feedback. Signups are stored in KV; feedback is stored in KV; both generate an email notification to `golftevora@gmail.com`.

The email sender in `src/worker.js` is `notifications@golftevora.com`. Change it there if you prefer another sender on the onboarded domain.
