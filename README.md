# chriskuenze.com

Personal website of Christopher Kuenze, PhD, ATC, FNATA. A plain static site (HTML, CSS, JavaScript) hosted on GitHub Pages. There is no build server; GitHub serves these files as they are.

## What's here

| Path | What it is |
|---|---|
| `index.html` | Home: hero with live co-author network, stats, recent work, projects, bio, links |
| `research.html`, `publications.html`, `mentoring.html`, `contact.html` | Built from `Research Assistant/tools/website/pages/` by `assemble.ps1` (shares the home page's header and footer) |
| `data/publications.json` | All published papers, rebuilt from the CV each month |
| `data/highlights.json` | The four "Recent work" cards (hand-written summaries; edit to change) |
| `network/` | The interactive co-author network and insights tool |
| `assets/` | Stylesheet, script, favicon. Add `headshot.jpg` here for the About photo |
| `CNAME` | Tells GitHub Pages the site lives at chriskuenze.com |

## One-time setup

1. **Buy the domain.** Register `chriskuenze.com` (domain only, no hosting needed) at Reclaim Hosting or any registrar. Turn on WHOIS privacy.
2. **Create the repository.** On GitHub (account `ckuenze`), create a public repository named `chriskuenze.com` and upload these files to the `main` branch.
3. **Turn on Pages.** Repository → Settings → Pages → Source: *Deploy from a branch* → `main` / `(root)`. Under *Custom domain*, enter `chriskuenze.com`.
4. **Point the domain at GitHub.** In Reclaim's DNS editor, add:
   - `A` records for `@` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `CNAME` record for `www` → `ckuenze.github.io`
   - Remove any other `A` record for `@` (for example a Reclaim parking page).
5. **Secure it.** GitHub profile → Settings → Pages → *Verified domains* → add and verify `chriskuenze.com` (adds one TXT record). After DNS settles (minutes to a day), tick *Enforce HTTPS* in the repository's Pages settings.
6. **Contact form.** Create a free form at formspree.io with ckuenze@virginia.edu, then replace `FORMSPREE_ID` in `tools/website/pages/contact.html` and rebuild. Until then the form tells visitors to email directly.

## Monthly updates

The 1st-of-the-month Scholar task runs `tools/coauthor-network/build.ps1`, which refreshes `data/publications.json` and `network/` here from the CV. Upload the changed files to GitHub to publish them.

## Before going live (to do)

- LinkedIn link: replace `LINKEDIN_URL` in `index.html`.
- Headshot: add `assets/headshot.jpg` and swap the "CK" placeholder in the About section.
- Mentoring page: confirm current students and alumni are happy to be listed. Student photos go in `assets/people/` as `kathryn-southall.jpg`, `casey-moler.jpg`, `gabriella-nazari.jpg` (square, about 400 px); they appear automatically, and initials show until then.
- Media: `data/media.json` mirrors the CV's Popular Media section; add new podcasts and interviews there.
- Tip: name the GitHub repository `ckuenze.github.io` (with this `CNAME`) so your class-tool repositories also get pages under chriskuenze.com (for example chriskuenze.com/KINE-3620-Explorers/) once Pages is turned on for them.
- SPRINT: add a link if the program has its own page.
