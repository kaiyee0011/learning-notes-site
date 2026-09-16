import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const course = JSON.parse(await fs.readFile(path.join(root, "data/course.json"), "utf8"));
const [kind, requestedId] = process.argv.slice(2);

if (!kind || !requestedId || !["task", "reading"].includes(kind)) {
  console.error("Usage: node scripts/new-note.mjs <task|reading> <task-2|P1>");
  process.exit(1);
}

let target;
let content;

if (kind === "task") {
  const task = course.tasks.find((item) => item.id === requestedId.toLowerCase());
  if (!task) throw new Error(`Unknown task: ${requestedId}`);
  target = path.join(root, "content/tasks", `${task.id}.md`);
  content = `---\ntitle: ${task.title}\ntask: ${task.id}\ndate:\nduration_minutes:\ndifficulty:\nstatus: in-progress\ndraft: true\nsummary:\n---\n\n## Takeaway\n\n\n\n## 完成情况\n\n\n\n## 学习随笔\n\n\n\n## 下一步\n\n`;
} else {
  const code = requestedId.toUpperCase();
  const matches = course.tasks.flatMap((task) => task.readings.map((reading) => ({ task, reading }))).filter(({ reading }) => reading.code === code);
  if (!matches.length) throw new Error(`Unknown reading: ${requestedId}`);
  const { task, reading } = matches[0];
  target = path.join(root, "content/readings", `${code}.md`);
  content = `---\ntitle: ${reading.title}\ncode: ${code}\ntask: ${task.id}\ndate:\nduration_minutes:\ndifficulty:\ndraft: true\nsummary:\n---\n\n## 核心结论\n\n\n\n## 概念与例子\n\n\n\n## 仍然不清楚\n\n`;
}

try {
  await fs.access(target);
  throw new Error(`File already exists: ${target}`);
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

await fs.mkdir(path.dirname(target), { recursive: true });
await fs.writeFile(target, content);
console.log(`Created ${path.relative(root, target)}`);
console.log("Set draft: false when the note is ready to publish.");
