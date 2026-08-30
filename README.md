# Mufti Abdul Raheem Lecture Archive

An Urdu-first, independently maintained archive of AI-assisted summaries of public lectures from [Mufti Abdul Raheem's YouTube channel](https://www.youtube.com/@muftiabdulraheem).

This is not represented as Mufti Abdul Raheem's official personal website and does not claim his endorsement or institutional authorization. The original YouTube lecture remains the primary source.

## What this project does

The repository is both the website source and the content database:

1. YouTube's public RSS feed reports recent channel uploads.
2. The ingestion command skips IDs already recorded in `scripts/data/processed-videos.json`.
3. Gemini receives one public YouTube URL and a strict religious-content safety prompt.
4. Gemini returns structured Urdu and English data.
5. Zod validates the response and verifies that source metadata was not changed.
6. A Markdown article is added to `src/content/lectures/`.
7. Astro builds static pages, search data, sitemap, and RSS.
8. GitHub Actions commits only new articles and deploys `dist/` to GitHub Pages.

Published pages remain available if YouTube or Gemini is temporarily unavailable. Gemini is used only while processing a new video. There is no database, CMS, persistent backend, paid search service, or Vercel dependency.

## Technology

- Astro 7 with strict TypeScript and static output
- Tailwind CSS 4 through its Vite plugin
- Astro Content Collections
- Zod structured-output validation
- Google GenAI JavaScript SDK (`@google/genai`)
- YouTube public Atom/RSS feed (no YouTube Data API key)
- GitHub Actions and GitHub Pages
- Small client-side JavaScript only for search, the mobile menu, sharing, and click-to-load YouTube embeds

## Local development

### Requirements

- Node.js 24 (minimum supported version configured here: Node 22.12)
- npm 10 or newer

### Install and run

```bash
npm install
npm run dev
```

Astro prints the local address, normally `http://localhost:4321`.

Other commands:

```bash
npm run check     # Astro + TypeScript diagnostics
npm test          # ingestion validation and duplicate tests
npm run build     # checks, then creates the static dist/ folder
npm run preview   # preview the production build locally
```

The normal website build does **not** require Gemini or any secret.

## Gemini setup and safety

Local ingestion reads `GEMINI_API_KEY` from the existing `.env` file through `dotenv`. `.env` is ignored by Git and must never be committed. `.env.example` contains only an empty variable name:

```dotenv
GEMINI_API_KEY=
```

Test the configured key by processing exactly one new video:

```bash
npm run ingest -- --limit 1
```

The integration uses the current `@google/genai` SDK and Gemini's public-YouTube-URL video input. The configured model is `gemini-3.5-flash-lite`, a stable multimodal model with video input and structured-output support. It is chosen to reduce free-tier pressure. Automatic API retries are disabled: a rate-limit or quota response stops the run instead of spending another request. Google's direct YouTube URL feature is currently a preview feature; only public videos are supported and pricing/rate limits can change. The free tier currently limits YouTube video input to a total number of hours per day. See Google's current [video understanding documentation](https://ai.google.dev/gemini-api/docs/video-understanding) before changing models or quotas.

The prompt in `scripts/lib/gemini.ts` explicitly prohibits invented rulings, fatwas, Quran/Hadith references, Arabic quotations, examples, attributions, or independent religious answers. Uncertain material must be omitted. Zod validation catches malformed output, but AI summaries can still contain mistakes; manually review important religious content and always preserve the on-page disclaimer.

### Add the GitHub Actions secret

After pushing the repository:

1. Open the GitHub repository.
2. Go to **Settings → Secrets and variables → Actions**.
3. Choose **New repository secret**.
4. Name it exactly `GEMINI_API_KEY`.
5. Paste the key in GitHub's secret form and save it.

Do not put the key in repository variables, workflow YAML, commits, Issues, or build logs.

## YouTube detection

The channel is stored in `scripts/config/youtube-channel.json`:

- Handle: `@muftiabdulraheem`
- Stable channel ID: `UCaIDDjlLDZSINECCOsGjqPg`
- Feed: `https://www.youtube.com/feeds/videos.xml?channel_id=UCaIDDjlLDZSINECCOsGjqPg`

The channel ID was resolved once and stored so scheduled runs do not scrape YouTube pages. RSS supplies the latest public video IDs, titles, and publication dates; thumbnails use YouTube's stable image URL format. No YouTube API key is required.

YouTube's channel feed normally exposes only a recent window (often about 15 uploads). A two-hour schedule makes missing a normal new upload unlikely, but a disabled workflow lasting longer than the entire feed window can miss older items. Add those manually as described below.

## Manual ingestion

Process the latest one, five, or ten unprocessed feed videos:

```bash
npm run ingest -- --limit 1
npm run ingest -- --limit 5
npm run ingest -- --limit 10
```

Process one specific video that is still present in the channel's current RSS window:

```bash
npm run ingest -- --url "https://www.youtube.com/watch?v=VIDEO_ID"
```

Intentionally reprocess and overwrite the article generated for a current-feed video:

```bash
npm run ingest -- --url "https://www.youtube.com/watch?v=VIDEO_ID" --force
```

`--force` is deliberately explicit. Normal scheduled and manual runs never overwrite an existing article.

### Human edits and old lectures

- Edit a summary, title, topic, or tag directly in its file under `src/content/lectures/`.
- Keep the `slug` field and filename aligned.
- Deleting an article does not remove its ID from processed tracking. This prevents accidental regeneration. Remove the ID from `scripts/data/processed-videos.json` only if regeneration is intentional.
- To manually add an older lecture outside the RSS window, copy the frontmatter shape from an existing article, enter verified source metadata, and run `npm run check`. Do not mark hand-written content as AI-assisted unless it was actually produced that way.

## Content structure

```text
src/
  components/               reusable cards, navigation, lightweight video embed
  content/lectures/         generated and manually editable Markdown articles
  data/mufti-profile.ts     verified biography copy and source URLs
  layouts/                  shared metadata, header, and footer layout
  lib/                      lecture sorting and topic helpers
  pages/                    home, lectures, topics, search, about, profile, contact, RSS
  styles/                   Tailwind import and design tokens
scripts/
  config/                   stable YouTube channel configuration
  data/                     processed-video ID tracking
  lib/                      RSS, Gemini, schema, and safe content-write code
  ingest.ts                 ingestion command
tests/                      invalid-output and duplicate safeguards
.github/workflows/          scheduled ingestion and Pages deployment
public/                     robots, social card, CNAME, and .nojekyll
```

## Biography content and sources

Biography text is isolated in `src/data/mufti-profile.ts`, including source URLs next to the facts they support. The profile deliberately omits unverified birth dates, degrees, teachers, books, awards, qualifications, family details, and other personal claims.

Current sources:

- [Jamia Tur Rasheed official website](https://jtr.edu.pk/) — institution, location, and educational work.
- [Associated Press of Pakistan: Governor Sindh meets Mufti Abdul Raheem](https://www.app.com.pk/domestic/governor-sindh-meets-mufti-abdul-raheem-discusses-religious-and-educational-affairs/) — identifies him as administrator of Jamia Tur Rasheed.
- [Associated Press of Pakistan: Sindh governor lauds contributions of Jamia Tur Rasheed](https://www.app.com.pk/domestic/sindh-governor-lauds-contributions-of-jamia-tur-rasheed/) — identifies the institution as headed by him.

Review those links periodically because public roles can change.

## GitHub repository setup

Create an empty public repository on GitHub without adding a README or `.gitignore`, then run in this folder:

```bash
git init
git branch -M main
git add .
git commit -m "Initial production website"
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

Before `git add`, confirm `.env` is absent from `git status`. This project's `.gitignore` excludes `.env` and `.env.*` while allowing `.env.example`.

In **Settings → Actions → General → Workflow permissions**, select **Read and write permissions** so the scheduled workflow can commit new Markdown articles. Branch protection that blocks GitHub Actions from pushing to `main` must either allow the bot or use a reviewed pull-request workflow instead.

## GitHub Actions behavior

`.github/workflows/update-videos.yml` runs at minute 17 every two hours and can also run from **Actions → Update lectures and deploy Pages → Run workflow**. Pushes to `main` build and deploy without invoking Gemini.

On scheduled/manual runs it:

1. installs the locked dependencies with `npm ci`;
2. checks the RSS feed and skips processed IDs;
3. sends at most one new video to Gemini by default, with no automatic API retry;
4. validates and writes articles one at a time;
5. runs ingestion tests and the production build;
6. commits only when generated content changed;
7. rebases before pushing to reduce normal push conflicts;
8. uploads the already-built `dist/` artifact and deploys GitHub Pages.

If RSS, Gemini, quota, validation, or build fails, the job stops before deployment/commit at the unsafe point and existing repository content remains unchanged. A branch conflict that cannot be rebased safely leaves the workflow failed for manual resolution; it never force-pushes.

## Enable GitHub Pages

1. Push the repository and let the workflow file exist on `main`.
2. Go to **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **GitHub Actions**.
4. Run the workflow manually once or push a commit.
5. In **Custom domain**, enter `muftiabdulraheem.com` and save it **before** changing DNS.
6. Once DNS is valid and GitHub offers it, enable **Enforce HTTPS**.

The workflow uses GitHub's current Pages actions: `configure-pages@v5`, `upload-pages-artifact@v4`, and `deploy-pages@v4`. GitHub's Actions-based publishing does not require a `CNAME` file, but `public/CNAME` is included as a clear record of the intended domain. The important custom-domain value is still the one saved in repository **Settings → Pages**. See GitHub's [custom workflow](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) and [custom-domain](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site) documentation.

## Namecheap DNS for `muftiabdulraheem.com`

These values match GitHub's published Pages guidance checked on 28 August 2026. Recheck the [official GitHub Pages custom-domain documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site) before changing DNS because infrastructure addresses can change.

### 1. Verify ownership in GitHub first (recommended)

In GitHub profile **Settings → Pages → Add a domain**, enter `muftiabdulraheem.com`. GitHub provides a TXT challenge name and value. In Namecheap **Domain List → Manage → Advanced DNS**, add that exact TXT record, wait for DNS propagation, then click **Verify** in GitHub. Do not invent or reuse another account's verification token.

### 2. Add apex/root records in Namecheap

Remove conflicting parking, URL redirect, or old `A`/`AAAA` records for host `@`. Add four **A Record** rows:

| Type | Host | Value | TTL |
|---|---|---|---|
| A Record | `@` | `185.199.108.153` | Automatic |
| A Record | `@` | `185.199.109.153` | Automatic |
| A Record | `@` | `185.199.110.153` | Automatic |
| A Record | `@` | `185.199.111.153` | Automatic |

GitHub also publishes optional IPv6 `AAAA` values. If you choose to use IPv6, keep the A records and add all four current AAAA records from GitHub's documentation rather than copying an old list.

### 3. Add `www`

Add one **CNAME Record**:

| Type | Host | Value | TTL |
|---|---|---|---|
| CNAME Record | `www` | `YOUR-USERNAME.github.io` | Automatic |

Replace `YOUR-USERNAME` with the GitHub account or organization that owns the repository. Do not include `https://`, the repository name, a slash, or a path. Remove any conflicting record for host `www` first.

### 4. Finish in GitHub

In repository **Settings → Pages**, set the custom domain to the apex `muftiabdulraheem.com`. With both apex and `www` records configured, GitHub Pages redirects `www.muftiabdulraheem.com` to the chosen apex domain. DNS changes can take up to 24 hours, though Namecheap updates often appear sooner. Wait for GitHub's DNS check, then enable **Enforce HTTPS**; certificate issuance can also take time.

On Windows, verify without installing `dig`:

```powershell
Resolve-DnsName muftiabdulraheem.com
Resolve-DnsName www.muftiabdulraheem.com
```

Never add a wildcard (`*`) DNS record for GitHub Pages; GitHub warns that wildcards increase domain-takeover risk.

## Contact and acquisition messaging

The email and WhatsApp contact appear on the Contact page and footer. The homepage has a restrained acquisition section near the bottom, and the footer links to the Contact page's acquisition section. No popups, sticky sale banners, or repeated promotional blocks are used.

## Cost and operational limits

The architecture has zero mandatory recurring infrastructure cost when used within GitHub Free, GitHub Actions/Pages limits, and the Gemini Developer API free tier. The domain registration itself is not free. Quotas and provider policies can change.

Remaining operational limits:

- Gemini's direct YouTube URL input is a preview capability and supports public videos only.
- The YouTube RSS feed is a recent-upload window, not a full historical archive.
- Automated religious summaries should be manually reviewed when accuracy is especially important.
- Protected branches can prevent the scheduled bot commit unless repository rules explicitly permit it.
- Namecheap DNS and GitHub custom-domain/HTTPS settings require the domain and GitHub account owner to complete them.
