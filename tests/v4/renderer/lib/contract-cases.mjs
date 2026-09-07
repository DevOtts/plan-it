// Parses delivery/v4/CONTRACT.md's `## Cases` table — computed, never hand-typed (G-5).
import fs from 'node:fs';
import path from 'node:path';

function casesHeadingSection(text) {
  // The literal string "## Cases" also appears inline (in backticks, in prose) earlier in
  // the file — only a real heading line (bounded by newlines, not backticks) counts.
  const idx = text.lastIndexOf('\n## Cases\n');
  return idx === -1 ? '' : text.slice(idx + '\n## Cases\n'.length);
}

export function extractCaseRendererRows(repoRoot) {
  const contractPath = path.join(repoRoot, 'delivery', 'v4', 'CONTRACT.md');
  const text = fs.readFileSync(contractPath, 'utf-8');
  const casesSection = casesHeadingSection(text);
  const lines = casesSection.split('\n').filter((l) => /^\|\s*C-E\d+-\d{2}\s*\|/.test(l));
  const rows = [];
  for (const line of lines) {
    const cells = line.split('|').map((c) => c.trim());
    // | (empty) | ID | @tag | Case | run: | (empty) |
    const [, id, tag, , run] = cells;
    if (tag !== '@case-renderer') continue;
    const runMatch = run.match(/`([^`]+)`/);
    rows.push({ id, tag, run: runMatch ? runMatch[1] : run });
  }
  return rows;
}

export function extractAllCaseRows(repoRoot) {
  const contractPath = path.join(repoRoot, 'delivery', 'v4', 'CONTRACT.md');
  const text = fs.readFileSync(contractPath, 'utf-8');
  const casesSection = casesHeadingSection(text);
  const lines = casesSection.split('\n').filter((l) => /^\|\s*C-E\d+-\d{2}\s*\|/.test(l));
  return lines.map((line) => {
    const cells = line.split('|').map((c) => c.trim());
    const [, id, tag, caseText, run] = cells;
    const runMatch = run.match(/`([^`]+)`/);
    return { id, tag, caseText, run: runMatch ? runMatch[1] : run };
  });
}
