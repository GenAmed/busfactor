# Governance

busfactor is a project about bus factors, so here is its own, stated plainly.

1. **Today there is one maintainer** (GenAmed). That is a bus factor of 1, and this file exists so that it is not a dead end.
2. **A second maintainer is wanted.** Anyone with three merged, sourced entries in the successor map (or equivalent code contributions) will be offered co-maintainer rights: npm publish rights and GitHub admin. There is no other test.
3. **Minimum viable rhythm.** The maintainer commits to reviewing and merging successor-map pull requests within a week, and to nothing else. CI validates every entry against the registries; a weekly job revalidates the whole map and opens an issue when a successor dies. The project is designed to run on one hour a week.
4. **Scope is closed by default.** Feature requests are welcome as issues and stay open until someone sends a pull request. The maintainer will label them, not promise them.
5. **If the maintainer goes silent for 90 days** (no commit, review, comment or reply to a direct ping on the repository, on npm's email, or on the address in package.json), the contributor with the most merged pull requests in the previous twelve months may request ownership: open an issue titled "Maintainer silent, requesting transfer", wait 30 more days, then request the npm package transfer through npm support and fork the repository under the same name. This paragraph is the maintainer's written consent to that transfer.
6. **With two or more maintainers**, decisions (releases, adding a maintainer, changing this file) need one approval from another maintainer; successor-map entries are merged by any maintainer once CI is green; disagreements are settled by simple majority, and without a majority the status quo stays.
7. Releases are tagged from `main` only after `npm run validate` and `npm test` pass in CI.
8. This file changes by pull request.
