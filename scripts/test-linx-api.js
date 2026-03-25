#!/usr/bin/env node

const DEFAULTS = {
  baseUrl: process.env.LINX_API_BASE_URL || "http://localhost:9080/api",
  account: process.env.LINX_TEST_ACCOUNT || "Owl123456",
  password: process.env.LINX_TEST_PASSWORD || "W123456",
};

function parseArgs(argv) {
  const options = { ...DEFAULTS };

  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [rawKey, ...rest] = arg.slice(2).split("=");
    const value = rest.join("=");
    if (!value) continue;

    if (rawKey === "baseUrl") options.baseUrl = value.replace(/\/+$/, "");
    if (rawKey === "account") options.account = value;
    if (rawKey === "password") options.password = value;
  }

  return options;
}

async function safeJson(response) {
  const text = await response.text();
  try {
    return {
      text,
      json: text ? JSON.parse(text) : null,
    };
  } catch {
    return {
      text,
      json: null,
    };
  }
}

function previewBody(payload) {
  if (!payload) return "";
  const source = typeof payload === "string" ? payload : JSON.stringify(payload);
  return source.length > 240 ? `${source.slice(0, 240)}...` : source;
}

async function request(baseUrl, path, options = {}) {
  const url = `${baseUrl}${path}`;
  const headers = {
    Accept: "application/json",
    ...options.headers,
  };

  let body;
  if (options.body !== undefined) {
    body = JSON.stringify(options.body);
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    method: options.method || "GET",
    headers,
    body,
  });

  const payload = await safeJson(response);
  return {
    name: options.name || `${options.method || "GET"} ${path}`,
    url,
    status: response.status,
    ok: response.ok,
    payload,
  };
}

function evaluateResult(result) {
  const appCode = result.payload.json && typeof result.payload.json.code !== "undefined"
    ? result.payload.json.code
    : null;
  const success = result.ok && (appCode === null || appCode === 0);

  return {
    ...result,
    appCode,
    success,
  };
}

function printResult(result) {
  const marker = result.success ? "PASS" : "FAIL";
  const suffix = result.appCode === null ? "" : ` code=${result.appCode}`;
  console.log(`[${marker}] ${result.name} -> HTTP ${result.status}${suffix}`);

  if (!result.success) {
    const body = result.payload.json ?? result.payload.text;
    if (body) {
      console.log(`       ${previewBody(body)}`);
    }
  }
}

async function main() {
  if (typeof fetch !== "function") {
    throw new Error("Global fetch is unavailable. Use Node.js 18+.");
  }

  const options = parseArgs(process.argv.slice(2));
  console.log(`Base URL: ${options.baseUrl}`);
  console.log(`Account: ${options.account}`);

  const loginResult = evaluateResult(await request(options.baseUrl, "/auth/login", {
    method: "POST",
    name: "auth-login",
    body: {
      account: options.account,
      password: options.password,
    },
  }));

  printResult(loginResult);
  if (!loginResult.success) {
    process.exitCode = 1;
    return;
  }

  const token = loginResult.payload.json?.data?.accessToken;
  if (!token) {
    console.log("[FAIL] auth-login -> accessToken missing");
    process.exitCode = 1;
    return;
  }

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  const checks = [
    { name: "auth-userinfo", method: "GET", path: "/auth/userinfo" },
    { name: "linx-user-me", method: "GET", path: "/linx/user/me" },
    { name: "linx-friends", method: "GET", path: "/linx/friends" },
    { name: "linx-groups", method: "GET", path: "/linx/groups" },
    { name: "linx-history-unread-total", method: "GET", path: "/linx/chat/history/unread/total" },
    { name: "linx-chat-ticket", method: "GET", path: "/linx/chat/ticket" },
    { name: "linx-chat-link", method: "POST", path: "/linx/chat/link" },
    { name: "linx-user-status-online", method: "POST", path: "/linx/user/status", body: { status: "online" } },
  ];

  const results = [];
  for (const check of checks) {
    const result = evaluateResult(await request(options.baseUrl, check.path, {
      name: check.name,
      method: check.method,
      body: check.body,
      headers: authHeaders,
    }));
    results.push(result);
    printResult(result);
  }

  const failed = results.filter((item) => !item.success);
  console.log(`Summary: ${results.length - failed.length}/${results.length} passed`);
  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("[FAIL] script-error");
  console.error(error && error.stack ? error.stack : String(error));
  process.exitCode = 1;
});
