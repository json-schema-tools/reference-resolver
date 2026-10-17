/**
 * In-browser tests for the web bundle (issue #21).
 *
 * `npm run test:web` builds the web entry (src/index-web.ts) with webpack
 * into dist/bundle.js, then this script serves that bundle plus a test page
 * from a local HTTP server, loads the page in a real headless Chromium
 * (via Playwright) and exercises the resolver there.
 *
 * This is intentionally separate from the jest unit suite, which runs in
 * Node: the web entry stubs the `file` protocol handler and relies on the
 * browser's fetch, so only a real browser verifies it. The page and the
 * JSON fixtures are served same-origin so Chromium's Private Network
 * Access rules don't interfere.
 *
 * Run via: npm run test:web
 */
const fs = require("fs");
const http = require("http");
const path = require("path");
const { chromium } = require("playwright");

const BUNDLE = path.join(__dirname, "..", "dist", "bundle.js");

const DOC = {
  title: "browser-doc",
  type: "object",
  definitions: {
    foo: { type: "string" },
  },
};

const PAGE = `<!doctype html>
<html><head><meta charset="utf-8"><title>reference-resolver web test</title></head>
<body><script src="/bundle.js"></script></body></html>`;

async function main() {
  if (!fs.existsSync(BUNDLE)) {
    console.error(`missing ${BUNDLE} — run the webpack build first (npm run test:web does this)`);
    process.exit(2);
  }
  const bundle = fs.readFileSync(BUNDLE, "utf8");

  const server = http.createServer((req, res) => {
    if (req.url === "/bundle.js") {
      res.writeHead(200, { "Content-Type": "text/javascript" });
      res.end(bundle);
      return;
    }
    if (req.url === "/doc.json") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(DOC));
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(PAGE);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  // Bypass the ambient egress proxy: these tests only talk to the local
  // server, and proxying localhost is flaky and unnecessary.
  const browser = await chromium.launch({ args: ["--no-proxy-server"] });
  const page = await browser.newPage();
  await page.goto(`${baseUrl}/`, { waitUntil: "load" });

  const hasGlobal = await page.evaluate(() => typeof window.ReferenceResolver !== "undefined");
  if (!hasGlobal) {
    console.error("window.ReferenceResolver was not set by the bundle — check webpack library output");
    process.exit(2);
  }

  const results = await page.evaluate(async (url) => {
    const R = window.ReferenceResolver;
    const out = [];

    function eq(actual, expected) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    }

    async function throwsName(fn, name) {
      try {
        await fn();
      } catch (e) {
        if (e && e.name === name) {
          return;
        }
        throw new Error(`expected error ${name}, got ${e && e.name}: ${e && e.message}`);
      }
      throw new Error(`expected error ${name}, but nothing was thrown`);
    }

    async function t(name, fn) {
      try {
        await fn();
        out.push({ name, ok: true });
      } catch (e) {
        out.push({ name, ok: false, error: String((e && e.message) || e) });
      }
    }

    await t("resolves internal refs", async () => {
      eq(await R.resolve("#/properties/foo", { properties: { foo: "boo" } }), "boo");
    });

    await t("resolves http urls", async () => {
      eq((await R.resolve(`${url}/doc.json`)).title, "browser-doc");
    });

    await t("applies hash fragment to http urls", async () => {
      eq(await R.resolve(`${url}/doc.json#/definitions/foo`), { type: "string" });
    });

    await t("rejects file refs in the browser", async () => {
      await throwsName(() => R.resolve("./src/test-obj.json"), "InvalidFileSystemPathError");
    });

    await t("errors on bad json pointer", async () => {
      await throwsName(() => R.resolve("#/nope", { foo: { bar: true } }), "InvalidJsonPointerRefError");
    });

    await t("supports custom protocol handlers", async () => {
      R.protocolHandlerMap.ipfs = () => Promise.resolve({ title: "foo", type: "string" });
      eq(await R.resolve("ipfs://80088008800880088008"), { title: "foo", type: "string" });
    });

    return out;
  }, baseUrl);

  await browser.close();
  server.close();

  let failed = 0;
  for (const r of results) {
    console.log(`${r.ok ? "✓" : "✗"} ${r.name}${r.ok ? "" : ` — ${r.error}`}`);
    if (!r.ok) {
      failed++;
    }
  }
  if (failed > 0) {
    console.error(`${failed} browser test(s) failed`);
    process.exit(1);
  }
  console.log("all browser tests passed");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
