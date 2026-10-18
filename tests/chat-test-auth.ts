const BASE = process.env.BASE_URL || "http://localhost:3000";

export async function createTestSession(): Promise<{
  token: string;
  cookies: string;
}> {
  const ts = Date.now();
  const email = `testrunner-${ts}@lawbite-test.com`;
  const password = "TestRunner123!";

  const res = await fetch(`${BASE}/api/auth/sign-up/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: BASE,
    },
    body: JSON.stringify({ email, password, name: "Test Runner" }),
    redirect: "manual",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Sign-up failed (${res.status}): ${body}`);
  }

  const setCookie = res.headers.get("set-cookie") || "";
  const sessionMatch = setCookie.match(/better-auth\.session_token=([^;]+)/);
  if (!sessionMatch) {
    const body = await res.text();
    throw new Error(
      `No session cookie. Set-Cookie: ${setCookie.slice(0, 200)}. Body: ${body.slice(0, 300)}`,
    );
  }

  const token = sessionMatch[1];
  const cookies = `better-auth.session_token=${token}`;
  console.log(`Authenticated as: ${email}`);
  return { token, cookies };
}
