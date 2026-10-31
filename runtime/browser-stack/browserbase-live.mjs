import { browserbase, Stagehand } from "@browserbasehq/stagehand";

const input = process.argv[2] ?? "https://example.com";
const url = new URL(input);
if (url.protocol !== "https:" || !url.hostname || url.username || url.password) {
  throw new Error("Provide an HTTPS page URL without embedded credentials.");
}
if (["localhost", "127.0.0.1", "::1"].includes(url.hostname.toLowerCase()) ||
    url.hostname.endsWith(".local")) {
  throw new Error("Local/private browser targets are not supported by this entry point.");
}
const apiKey = process.env.BROWSERBASE_API_KEY;
if (!apiKey) throw new Error("BROWSERBASE_API_KEY is required in the runtime environment.");

let browser;
let stagehand;
const startedAt = new Date().toISOString();
try {
  browser = await browserbase.launch({ apiKey });
  stagehand = await Stagehand.create({ browser });
  const page = await browser.context.activePage();
  if (!page) throw new Error("Browserbase launched without an active page.");

  await page.goto(url.toString());
  const observedUrl = await page.url();
  if (!observedUrl || observedUrl === "about:blank") {
    throw new Error("Remote browser did not confirm external navigation.");
  }

  // Session ID and observed page URL are proof of browser activity, not proof of login.
  console.log(JSON.stringify({
    status: "navigated",
    provider: "browserbase",
    sessionId: browser.sessionId ?? null,
    requestedUrl: url.toString(),
    observedUrl,
    startedAt,
    observedAt: new Date().toISOString(),
    authenticatedToDestination: false,
    executor: "S/Agency browser runtime",
  }, null, 2));
} finally {
  if (stagehand) await stagehand.close().catch(() => {});
  if (browser) await browser.close().catch(() => {});
}
