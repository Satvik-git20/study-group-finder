/**
 * Generates the screenshots used in the README.
 *
 *   pnpm capture
 *
 * Serves the production build and drives the locally installed Chrome via
 * Playwright's `channel: "chrome"`, so no browser download is required. A
 * signed-in demo session is injected into localStorage before the app boots,
 * which means every shot shows real data from the real app.
 */
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(HERE, "..", "dist");
const OUT = path.resolve(HERE, "..", "..", "..", "docs", "screenshots");
const PORT = 4183;

const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".map": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

function startServer() {
  const indexFile = path.join(DIST, "index.html");

  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
    const requested = path.join(DIST, decodeURIComponent(url.pathname));

    // Serve the real asset when it exists, otherwise fall back to index.html so
    // client-side routes resolve — mirroring how a static host must be set up.
    const file =
      url.pathname !== "/" && existsSync(requested) && !requested.endsWith("/")
        ? requested
        : indexFile;

    try {
      const body = await readFile(file);
      res.writeHead(200, {
        "content-type": MIME[path.extname(file)] ?? "application/octet-stream",
      });
      res.end(body);
    } catch {
      res.writeHead(404).end("not found");
    }
  });

  return new Promise((resolve) => server.listen(PORT, () => resolve(server)));
}

/** Seeds a signed-in session so the app boots straight into a populated state. */
function seedScript() {
  const users = [
    {
      id: "u_demo",
      name: "Aisha Patel",
      email: "demo@studysync.app",
      subjects: ["Linear Algebra", "Machine Learning"],
      availability: "Evenings & weekends",
    },
  ];
  localStorage.setItem("ssync_users", JSON.stringify(users));
  localStorage.setItem("ssync_session", JSON.stringify("u_demo"));
  localStorage.setItem("ssync_notifs", JSON.stringify([]));

  // Realistic stats for the sample students so the leaderboard and analytics
  // screenshots look like a used app rather than an empty one. This only
  // affects the captured screenshots, not the app's own behaviour.
  const stats = {
    u_demo: { points: 145, badges: ["Founder", "Scholar"], studyMinutes: 620, searchHistory: [] },
    u2: { points: 210, badges: ["Scholar", "Active Learner", "Organizer"], studyMinutes: 940, searchHistory: [] },
    u3: { points: 98, badges: ["Active Learner"], studyMinutes: 310, searchHistory: [] },
    u4: { points: 176, badges: ["Founder", "Mentor", "Quiz Master"], studyMinutes: 780, searchHistory: [] },
    u5: { points: 64, badges: ["Active Learner"], studyMinutes: 205, searchHistory: [] },
    u6: { points: 121, badges: ["Founder", "Scholar"], studyMinutes: 500, searchHistory: [] },
    u7: { points: 88, badges: ["Founder", "Mentor"], studyMinutes: 410, searchHistory: [] },
    u8: { points: 43, badges: ["Active Learner"], studyMinutes: 150, searchHistory: [] },
    u9: { points: 27, badges: [], studyMinutes: 95, searchHistory: [] },
    u10: { points: 12, badges: [], studyMinutes: 40, searchHistory: [] },
    u11: { points: 134, badges: ["Founder", "Mentor", "Quiz Master"], studyMinutes: 660, searchHistory: [] },
    u12: { points: 76, badges: ["Active Learner"], studyMinutes: 240, searchHistory: [] },
    u13: { points: 51, badges: ["Founder"], studyMinutes: 180, searchHistory: [] },
  };
  localStorage.setItem("ssync_stats", JSON.stringify(stats));
}

const SHOTS = [
  { name: "01-dashboard", path: "/", waitFor: "text=All study groups" },
  { name: "02-group-chat", path: "/groups/g1", waitFor: "text=Group chat" },
  {
    name: "03-leaderboard",
    path: "/leaderboard",
    waitFor: "text=Top learners this season",
  },
  { name: "04-create-group", path: "/create", waitFor: "text=Start your group" },
];

async function main() {
  if (!existsSync(DIST)) {
    console.error("dist/ not found. Run `pnpm build` first.");
    process.exit(1);
  }

  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  const server = await startServer();
  const browser = await chromium.launch({ channel: "chrome" });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    colorScheme: "dark",
  });

  await context.addInitScript(seedScript);
  const page = await context.newPage();

  for (const shot of SHOTS) {
    await page.goto(`http://localhost:${PORT}${shot.path}`, {
      waitUntil: "networkidle",
    });
    try {
      await page.waitForSelector(shot.waitFor, { timeout: 10_000 });
    } catch {
      console.warn(`  ! "${shot.waitFor}" not found on ${shot.path}`);
    }
    // Let the fade-in animation settle so shots are not caught mid-transition.
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(OUT, `${shot.name}.png`) });
    console.log(`  captured ${shot.name}.png`);
  }

  await browser.close();
  server.close();
  console.log(`\nDone. Screenshots written to ${path.relative(process.cwd(), OUT)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
