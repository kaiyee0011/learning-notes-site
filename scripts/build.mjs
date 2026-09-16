import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import MarkdownIt from "markdown-it";
import nunjucks from "nunjucks";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(root, "dist");
const course = JSON.parse(await fs.readFile(path.join(root, "data/course.json"), "utf8"));
const markdown = new MarkdownIt({ html: true, linkify: true, typographer: true });
const env = nunjucks.configure(path.join(root, "templates"), {
  autoescape: true,
  noCache: true,
});

const pad = (value) => String(value).padStart(2, "0");
env.addFilter("pad2", pad);

function formatDeadline(value) {
  const date = new Date(value);
  return `${pad(date.getMonth() + 1)} 月 ${pad(date.getDate())} 日 ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
}

async function loadNote(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = matter(raw);
    if (parsed.data.draft === true) return null;
    return {
      meta: parsed.data,
      html: markdown.render(parsed.content),
    };
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function decorateCourse() {
  const tasks = [];

  for (const rawTask of course.tasks) {
    const taskFile = path.join(root, "content/tasks", `${rawTask.id}.md`);
    const taskNote = await loadNote(taskFile);
    const readings = [];

    for (const rawReading of rawTask.readings) {
      const readingFile = path.join(root, "content/readings", `${rawReading.code}.md`);
      const readingNote = await loadNote(readingFile);
      readings.push({
        ...rawReading,
        note: readingNote,
        learningDate: formatDate(readingNote?.meta.date),
        durationMinutes: readingNote?.meta.duration_minutes ?? null,
        url: readingNote ? `./readings/${rawReading.code}/` : null,
      });
    }

    const difficulty = taskNote?.meta.difficulty ?? null;
    const task = {
      ...rawTask,
      deadlineDisplay: formatDeadline(rawTask.deadline),
      note: taskNote,
      noteUrl: taskNote ? `./notes/${rawTask.id}/` : null,
      learningDate: formatDate(taskNote?.meta.date),
      durationMinutes: taskNote?.meta.duration_minutes ?? null,
      difficulty,
      difficultyFilled: difficulty ? Array.from({ length: difficulty }) : [],
      difficultyEmpty: difficulty ? Array.from({ length: 5 - difficulty }) : [],
      readings,
      searchText: [rawTask.title, ...rawTask.requirements, ...rawTask.readings.flatMap((item) => [item.code, item.title, item.track])].join(" "),
    };
    tasks.push(task);
  }

  return tasks;
}

async function writeFile(relativePath, content) {
  const target = path.join(distDir, relativePath);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, content);
}

const tasks = await decorateCourse();
const completedTasks = tasks.filter((task) => task.note).length;
const progressPercent = Math.round((completedTasks / tasks.length) * 10000) / 100;
const latestTask = [...tasks].reverse().find((task) => task.note) ?? null;
const common = {
  site: course.site,
  tasks,
  completedTasks,
  totalTasks: tasks.length,
  progressPercent,
  latestTask,
  generatedAt: new Date().toISOString(),
};

await fs.rm(distDir, { recursive: true, force: true });
await fs.mkdir(distDir, { recursive: true });
await fs.cp(path.join(root, "public"), distDir, { recursive: true });

await writeFile("index.html", env.render("index.njk", { ...common, basePath: "./" }));

for (const task of tasks) {
  if (task.note) {
    await writeFile(
      `notes/${task.id}/index.html`,
      env.render("task.njk", {
        ...common,
        basePath: "../../",
        currentTask: task,
        pageTitle: `${task.title} · ${course.site.title}`,
        contentHtml: task.note.html,
      }),
    );
  }

  for (const reading of task.readings) {
    if (!reading.note) continue;
    await writeFile(
      `readings/${reading.code}/index.html`,
      env.render("reading.njk", {
        ...common,
        basePath: "../../",
        currentTask: task,
        currentReading: reading,
        pageTitle: `${reading.code} · ${reading.title}`,
        contentHtml: reading.note.html,
      }),
    );
  }
}

console.log(`Built ${completedTasks}/${tasks.length} task notes into ${distDir}`);
