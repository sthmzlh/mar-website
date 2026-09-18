const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
import os from "node:os";
import { readdir, readFile, access } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
const root = path.resolve("dist");
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map(e => e.isDirectory() ? walk(path.join(dir, e.name)) : path.join(dir, e.name)))).flat();
}
const files = (await walk(root)).filter(f => f.endsWith(".html"));
let checkedLinks = 0;
for (const file of files) {
  const html = (await readFile(file, "utf8")).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  assert.match(html, /<title>.+?<\/title>/);
  for (const match of html.matchAll(/(?:href|src)="(\/[^"#?]*)(?:[?#][^"]*)?"/g)) {
    if (match[1].startsWith("//")) continue;
    const target = path.join(root, decodeURIComponent(match[1]));
    await access(target.endsWith(path.sep) || !path.extname(target) ? path.join(target, "index.html") : target);
    checkedLinks++;
  }
}
const browser = await chromium.launch({headless:true, channel: process.env.BROWSER_CHANNEL || "msedge"});
const page = await browser.newPage({viewport:{width:1440,height:1000}});
const errors = [];
page.on("pageerror", e => errors.push(e.message));
await page.goto("http://127.0.0.1:4322/", {waitUntil:"networkidle"});
await page.screenshot({path:path.join(os.tmpdir(), "mar-desktop.png")});
assert.equal(await page.locator(".lecture-card").count(), 6);
await page.locator("#home-search").fill("Doha");
await page.locator(".hero-search button").click();
await page.waitForURL("**/search/?q=Doha");
await page.waitForSelector("#search-results article");
assert.equal(await page.locator("#search-input").inputValue(), "Doha");
await page.locator("#search-input").fill("zzzznonexistentzz");
await page.waitForFunction(() => document.querySelector("#result-count").textContent === "0 summaries");
await page.locator("#search-input").fill("");
await page.waitForFunction(() => document.querySelectorAll("#search-results article").length > 10);
await page.goto("http://127.0.0.1:4322/bayan/violation-of-the-doha-agreement/");
await page.getByRole("link", {name:"اردو خلاصہ ↓"}).click();
assert.ok(page.url().endsWith("#urdu-summary"));
await page.locator(".light-youtube button").click();
assert.match(await page.locator(".light-youtube iframe").getAttribute("src"), /^https:\/\/www.youtube-nocookie.com\/embed\//);
for (const width of [390, 320]) {
  await page.setViewportSize({width,height:844});
  for (const route of ["/", "/bayan/", "/search/", "/topics/", "/bayan/violation-of-the-doha-agreement/"]) {
    await page.goto("http://127.0.0.1:4322" + route);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "Horizontal overflow: " + route + " width=" + width);
  }
}
await page.goto("http://127.0.0.1:4322/");
await page.setViewportSize({width:390,height:844});
await page.locator("#menu-toggle").click();
assert.equal(await page.locator("#menu-toggle").getAttribute("aria-expanded"), "true");
await page.keyboard.press("Escape");
assert.equal(await page.locator("#menu-toggle").getAttribute("aria-expanded"), "false");
await page.screenshot({path:path.join(os.tmpdir(), "mar-mobile.png")});
assert.deepEqual(errors, []);
console.log(JSON.stringify({pages:files.length,localLinks:checkedLinks,browserErrors:errors,search:"passed",mobile:"passed",videoEmbed:"passed"}));
await browser.close();
