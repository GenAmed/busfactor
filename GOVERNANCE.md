# Governance

1. busfactor is maintained by at least **two maintainers** at all times; a project about bus factors does not get to have one of 1.
2. Every maintainer has **publish rights on npm** and admin rights on the GitHub repository; there is no single owner account.
3. Maintainers are listed in `package.json` (`contributors`) and in the npm package's maintainer list; both must match.
4. **Decisions** (merging PRs, releases, adding a maintainer) need one approval from another maintainer. Entries in the successor map are merged by any maintainer once CI is green.
5. Disagreements are settled by simple majority of maintainers; with two maintainers and no majority, the status quo stays.
6. Anyone with three merged, sourced entries can be proposed as a maintainer; acceptance follows rule 4.
7. If a maintainer is **silent for 90 days** (no commit, review, comment or reply to a direct ping), the others may move them to "emeritus", remove their publish rights, and add a replacement so rule 1 holds.
8. An emeritus maintainer is welcome back on request, with rule 4 applying.
9. Releases are tagged from `main` only after `npm run validate` and `npm test` pass in CI.
10. This file changes by pull request under the same rules as any other change.
