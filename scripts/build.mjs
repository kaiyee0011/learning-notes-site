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

function formatDeadlineCompact(value) {
  const date = new Date(value);
  return `${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function courseSourceUrl(sourcePath) {
  const encodedPath = sourcePath.split("/").map(encodeURIComponent).join("/");
  return `${course.site.courseRepository}/blob/main/${encodedPath}`;
}

function formatDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
}

// 源文件里的图片写成 ../../public/assets/，这样 VS Code 预览能直接解析；
// 构建时 public/ 的内容被铺到 dist/ 根部，所以产物里要去掉 public 这一层。
function rewriteAssetPaths(html) {
  return html.replaceAll("../../public/assets/", "../../assets/");
}

// 从渲染后的 HTML 数字数，而不是数 Markdown 源码：笔记正文里混了 thought-list 这类
// 内联 HTML，数源码会把标签和 class 名也算进去。代码块按惯例不计入正文字数。
function countWords(html) {
  const text = html
    .replace(/<pre[\s\S]*?<\/pre>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;|&#\d+;/gi, " ");
  // 中日韩字符按「字」计，拉丁字母与数字串按「词」计
  const cjk = text.match(/[㐀-䶿一-鿿぀-ヿ가-힯]/g)?.length ?? 0;
  const latin = text.match(/[A-Za-z0-9][A-Za-z0-9'’._-]*/g)?.length ?? 0;
  return cjk + latin;
}

async function loadNote(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = matter(raw);
    if (parsed.data.draft === true) return null;
    const html = rewriteAssetPaths(markdown.render(parsed.content));
    return {
      meta: parsed.data,
      html,
      wordCount: countWords(html),
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
        summary: readingNote?.meta.summary ?? null,
        learningDate: formatDate(readingNote?.meta.date),
        durationMinutes: readingNote?.meta.duration_minutes ?? null,
        wordCount: readingNote?.wordCount ?? null,
        wordCountDisplay: readingNote ? readingNote.wordCount.toLocaleString("en-US") : null,
        sourceUrl: courseSourceUrl(rawReading.sourcePath),
        url: readingNote ? `./readings/${rawReading.code}/` : null,
      });
    }

    const difficulty = taskNote?.meta.difficulty ?? null;
    const task = {
      ...rawTask,
      durationDisplay: rawTask.durationLabel ?? `${rawTask.durationDays} 天`,
      deadlineDisplay: rawTask.deadline ? formatDeadline(rawTask.deadline) : rawTask.deadlineLabel,
      deadlineCompact: rawTask.deadline ? formatDeadlineCompact(rawTask.deadline) : rawTask.deadlineLabel,
      note: taskNote,
      isComplete: taskNote?.meta.status === "completed",
      noteUrl: taskNote ? `./notes/${rawTask.id}/` : null,
      learningDate: formatDate(taskNote?.meta.date),
      durationMinutes: taskNote?.meta.duration_minutes ?? null,
      wordCount: taskNote?.wordCount ?? null,
      wordCountDisplay: taskNote ? taskNote.wordCount.toLocaleString("en-US") : null,
      difficulty,
      difficultyFilled: difficulty ? Array.from({ length: difficulty }) : [],
      difficultyEmpty: difficulty ? Array.from({ length: 5 - difficulty }) : [],
      readings,
      // 任务笔记末尾的「阅读笔记」预览只列已写好的
      notedReadings: readings.filter((reading) => reading.note),
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
