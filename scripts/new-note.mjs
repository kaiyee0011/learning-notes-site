import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const course = JSON.parse(await fs.readFile(path.join(root, "data/course.json"), "utf8"));
const [kind, requestedId] = process.argv.slice(2);

const USAGE = "Usage: node scripts/new-note.mjs <task|reading|all> [task-2|P1]";

// 课程标题里可能出现 YAML 的特殊字符，批量生成时统一走一次转义，避免生成出读不了的 frontmatter。
function yamlValue(value) {
  if (value === undefined || value === null || value === "") return "";
  const text = String(value);
  return /^[\s>|*&!%@`#-]|[:#]\s|["'{}[\],]|\s$/.test(text) ? `"${text.replaceAll('"', '\\"')}"` : text;
}

function taskTemplate(task) {
  return [
    "---",
    `title: ${yamlValue(task.title)}`,
    `task: ${task.id}`,
    "date:",
    "duration_minutes:",
    "difficulty:",
    "status: in-progress",
    "draft: true",
    "summary:",
    "---",
    "",
    "## 心得",
    "",
    "### 核心收获",
    "",
    "",
    "",
    "### 学习过程中的随笔",
    "",
    "",
    "",
    "### 下一步",
    "",
    "",
  ].join("\n");
}

function readingTemplate(task, reading) {
  return [
    "---",
    `title: ${yamlValue(reading.title)}`,
    `code: ${reading.code}`,
    `task: ${task.id}`,
    `source: ${yamlValue(reading.sourcePath)}`,
    "date:",
    "duration_minutes:",
    "draft: true",
    "summary:",
    "---",
    "",
    "## Takeaway",
    "",
    "",
    "",
    "## 学习过程中的随笔",
    "",
    "<!-- 纯文字随笔用 text-thought，配图随笔用 note-figure；图片很宽或自带正文时加 is-wide -->",
    '<div class="thought-list">',
    '  <div class="text-thought"><span>01</span><p></p></div>',
    '  <figure class="note-figure">',
    '    <figcaption><span>02</span><p></p></figcaption>',
    '    <img src="../../public/assets/.png" alt="" loading="lazy">',
    "  </figure>",
    "</div>",
    "",
  ].join("\n");
}

// course.json 里每个 task / reading 对应一个笔记文件，这里统一算出来，单篇和批量共用。
function plannedNotes() {
  const notes = [];
  for (const task of course.tasks) {
    notes.push({
      id: task.id,
      label: `task ${task.id}`,
      target: path.join(root, "content/tasks", `${task.id}.md`),
      build: () => taskTemplate(task),
    });
    for (const reading of task.readings) {
      notes.push({
        id: reading.code,
        label: `reading ${reading.code}`,
        target: path.join(root, "content/readings", `${reading.code}.md`),
        build: () => readingTemplate(task, reading),
      });
    }
  }
  return notes;
}

async function exists(target) {
  try {
    await fs.access(target);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function writeNote(note) {
  await fs.mkdir(path.dirname(note.target), { recursive: true });
  await fs.writeFile(note.target, note.build());
}

const notes = plannedNotes();

if (kind === "all") {
  let created = 0;
  let skipped = 0;
  for (const note of notes) {
    if (await exists(note.target)) {
      skipped += 1;
      continue;
    }
    await writeNote(note);
    created += 1;
    console.log(`Created ${path.relative(root, note.target)}`);
  }
  console.log(`\n${created} created, ${skipped} already existed.`);
  console.log("All new files are draft: true — 填好内容后把 draft 改成 false 才会出现在网站上。");
  process.exit(0);
}

if (!kind || !requestedId || !["task", "reading"].includes(kind)) {
  console.error(USAGE);
  process.exit(1);
}

const wanted = kind === "task" ? requestedId.toLowerCase() : requestedId.toUpperCase();
const note = notes.find((item) => item.id === wanted && item.target.includes(kind === "task" ? "/tasks/" : "/readings/"));
if (!note) throw new Error(`Unknown ${kind}: ${requestedId}`);
if (await exists(note.target)) throw new Error(`File already exists: ${note.target}`);

await writeNote(note);
console.log(`Created ${path.relative(root, note.target)}`);
console.log("Set draft: false when the note is ready to publish.");
