// Stop hook: logs each finished turn (prompt, response summary, token usage) to docs/prompts.md.
// Reads the hook payload from stdin and parses the session transcript. The transcript may not yet
// contain the final reply when Stop fires, so the latest turn is polled briefly; earlier turns that
// were missed or logged empty are (re)written on the next run.
import fs from 'node:fs';
import path from 'node:path';

const RESPONSE_CHARS = 400;
const PROMPT_CHARS = 4000;
const WAIT_MS = 5000;
const POLL_MS = 250;

const input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
const projectDir = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
const logFile = path.join(projectDir, 'docs', 'prompts.md');
if (!input.transcript_path || !fs.existsSync(input.transcript_path)) process.exit(0);

const textOf = (content) =>
  typeof content === 'string'
    ? content
    : (content || []).filter((c) => c.type === 'text').map((c) => c.text).join('\n');

const isRealPrompt = (e) =>
  e.type === 'user' &&
  !e.isMeta &&
  !(Array.isArray(e.message?.content) && e.message.content.some((c) => c.type === 'tool_result')) &&
  !textOf(e.message?.content).startsWith('<local-command-stdout>');

function readEntries() {
  return fs
    .readFileSync(input.transcript_path, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter((e) => e && !e.isSidechain);
}

// Splits the transcript into turns: a real prompt (slash-command expansions share its promptId)
// followed by everything up to the next real prompt.
function turnsOf(entries) {
  const turns = [];
  for (const e of entries) {
    if (isRealPrompt(e)) {
      const last = turns[turns.length - 1];
      if (last && last.prompt.promptId && last.prompt.promptId === e.promptId && !last.rest.length) continue;
      turns.push({ prompt: e, rest: [] });
    } else if (turns.length) {
      turns[turns.length - 1].rest.push(e);
    }
  }
  return turns;
}

function summarize({ prompt, rest }) {
  const usage = { input: 0, cacheWrite: 0, cacheRead: 0, output: 0, thinking: 0 };
  const seen = new Set();
  const tools = {};
  const files = new Set();
  const models = new Set();
  let lastText = '';
  let lastTs = prompt.timestamp;
  for (const e of rest) {
    if (e.type !== 'assistant') continue;
    const m = e.message;
    lastTs = e.timestamp || lastTs;
    if (m.model && !m.model.startsWith('<')) models.add(m.model);
    // Assistant messages are split across entries sharing message.id; count usage once per id.
    if (!seen.has(m.id) && m.usage) {
      seen.add(m.id);
      usage.input += m.usage.input_tokens || 0;
      usage.cacheWrite += m.usage.cache_creation_input_tokens || 0;
      usage.cacheRead += m.usage.cache_read_input_tokens || 0;
      usage.output += m.usage.output_tokens || 0;
      usage.thinking += m.usage.output_tokens_details?.thinking_tokens || 0;
    }
    for (const c of m.content || []) {
      if (c.type === 'text' && c.text.trim()) lastText = c.text.trim();
      if (c.type === 'tool_use') {
        tools[c.name] = (tools[c.name] || 0) + 1;
        const f = c.input?.file_path;
        if (f && ['Edit', 'Write', 'NotebookEdit'].includes(c.name)) files.add(path.relative(projectDir, f).replace(/\\/g, '/'));
      }
    }
  }
  return { usage, calls: seen.size, tools, files, models, lastText, lastTs };
}

function render(turn, s) {
  const { prompt } = turn;
  let promptText = textOf(prompt.message.content);
  // Slash commands are stored as <command-name>/x</command-name>…<command-args>y</command-args>.
  const cmd = promptText.match(/<command-name>(.*?)<\/command-name>/s);
  if (cmd) {
    const args = promptText.match(/<command-args>(.*?)<\/command-args>/s);
    promptText = `${cmd[1].trim()} ${args ? args[1].trim() : ''}`.trim();
  }
  if (promptText.length > PROMPT_CHARS) promptText = promptText.slice(0, PROMPT_CHARS) + ' …';

  const fmt = (n) => n.toLocaleString('en-US');
  const secs = Math.max(0, Math.round((new Date(s.lastTs) - new Date(prompt.timestamp)) / 1000));
  const duration = secs >= 60 ? `${Math.floor(secs / 60)}m ${secs % 60}s` : `${secs}s`;
  const oneLine = s.lastText.replace(/\s+/g, ' ');
  const brief = oneLine.length > RESPONSE_CHARS ? oneLine.slice(0, RESPONSE_CHARS) + ' …' : oneLine;
  const quote = (t) => t.split('\n').map((l) => `> ${l}`).join('\n');
  const toolList = Object.entries(s.tools).map(([k, v]) => `${k}×${v}`).join(', ') || '—';
  const u = s.usage;

  return `
## ${prompt.timestamp.replace('T', ' ').slice(0, 19)} UTC · \`${prompt.gitBranch || '—'}\`
<!-- prompt:${prompt.promptId || prompt.uuid} session:${prompt.sessionId} -->

${quote(promptText)}

**Response:** ${brief || '_(no text)_'}

| Model | Duration | Input | Cache write | Cache read | Output (thinking) | API calls |
|---|---|---|---|---|---|---|
| ${[...s.models].join(', ') || '—'} | ${duration} | ${fmt(u.input)} | ${fmt(u.cacheWrite)} | ${fmt(u.cacheRead)} | ${fmt(u.output)} (${fmt(u.thinking)}) | ${s.calls} |

**Tools:** ${toolList}${s.files.size ? `  \n**Files changed:** ${[...s.files].map((f) => `\`${f}\``).join(', ')}` : ''}
`;
}

// Wait until the latest turn's final reply has reached the transcript.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let turns = turnsOf(readEntries());
for (let waited = 0; waited < WAIT_MS; waited += POLL_MS) {
  const latest = turns[turns.length - 1];
  if (latest && summarize(latest).lastText) break;
  await sleep(POLL_MS);
  turns = turnsOf(readEntries());
}

let log = fs.existsSync(logFile)
  ? fs.readFileSync(logFile, 'utf8')
  : '# Prompt log\n\nAppended automatically by `.claude/hooks/log-prompt.mjs` after every turn.\n';
const before = log;

for (const turn of turns) {
  const s = summarize(turn);
  if (!s.lastText && !s.calls) continue; // nothing answered yet — a later run will log it
  const key = `<!-- prompt:${turn.prompt.promptId || turn.prompt.uuid} `;
  const at = log.indexOf(key);
  if (at < 0) {
    // Insert before the first entry that is newer, so backfilled turns stay in time order.
    const stamp = turn.prompt.timestamp.replace('T', ' ').slice(0, 19);
    const newer = [...log.matchAll(/\n## (\d{4}-\d\d-\d\d \d\d:\d\d:\d\d) UTC/g)].find((m) => m[1] > stamp);
    const pos = newer ? newer.index : log.length;
    log = log.slice(0, pos) + render(turn, s) + log.slice(pos);
    continue;
  }
  // Replace an entry that was written before its reply existed.
  const start = log.lastIndexOf('\n## ', at);
  const next = log.indexOf('\n## ', at);
  const end = next < 0 ? log.length : next;
  if (log.slice(start, end).includes('**Response:** _(no text)_')) {
    log = log.slice(0, start) + render(turn, s).trimEnd() + '\n' + log.slice(end);
  }
}

if (log !== before) {
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  fs.writeFileSync(logFile, log);
}
