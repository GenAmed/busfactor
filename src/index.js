// Library entry point, for people who want to call busfactor from their own
// Node code instead of the CLI:
//
//   import { scan, renderMarkdown } from "busfactor";
//   const result = await scan({ target: "./my-project" });
//
// The successor map is also available without any code:
//   import successors from "busfactor/successors" with { type: "json" };

export { scan, VERSION } from "./scan.js";
export { classify } from "./classify.js";
export { aggregateHumans } from "./humans.js";
export { loadSuccessors, matchSuccessors } from "./successors.js";
export { loadLockfile, LOCKFILES } from "./lockfiles/index.js";
export { renderTable } from "./report/table.js";
export { renderMarkdown } from "./report/md.js";
export { renderSvg } from "./report/svg.js";
