const fs = require("fs");
const p = "./modules/ra/ra.validation.js";
let s = fs.readFileSync(p, "utf8");

const replacements = [
  [
    '["GREENHOUSE", "LEVER", "ASHBY", "SMARTRECRUITERS", "BOTH", "ALL"]',
    '["GREENHOUSE", "LEVER", "ASHBY", "SMARTRECRUITERS", "W3GLOBAL", "BOTH", "ALL"]'
  ],
  [
    '"location", "source", "after", "before", "boards", "onlyRequestedBoards",',
    '"location", "source", "after", "before", "boards", "onlyRequestedBoards", "pages",'
  ],
  [
    '    onlyRequestedBoards: input.onlyRequestedBoards === true,',
    '    onlyRequestedBoards: input.onlyRequestedBoards === true,\n    pages: input.pages == null || input.pages === "" ? 1 : Math.max(1, Math.min(100, Math.floor(Number(input.pages) || 1))),'
  ]
];

for (const [before, after] of replacements) {
  if (!s.includes(before)) {
    console.error("STOP: Expected text not found; no file written.");
    process.exit(1);
  }
  s = s.replace(before, after);
}

fs.writeFileSync(p, s, "utf8");
console.log("SUCCESS: W3GLOBAL and pages validation updated.");

