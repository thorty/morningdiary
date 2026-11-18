 
const MAX_REQUEST_BYTES = 16 * 1024;
const BACKEND_TIMEOUT_MS = 9_000;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const mediaType = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if (mediaType !== "application/json") {
    return Response.json({ detail: "Content-Type must be application/json." }, { status: 415 });
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return Response.json({ detail: "Request body is too large." }, { status: 413 });
  }

  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > MAX_REQUEST_BYTES) {
    return Response.json({ detail: "Request body is too large." }, { status: 413 });
  }

  try {
    JSON.parse(body);
  } catch {
    return Response.json({ detail: "Request body must be valid JSON." }, { status: 400 });
  }

  const backendBaseUrl = process.env.BACKEND_URL ?? process.env.BACKEND_BASE_URL;
  if (!backendBaseUrl) {
    return Response.json({ detail: "Coach Summary service is not configured." }, { status: 503 });
  }

  let backendEndpoint: URL;
  try {
    backendEndpoint = new URL("/api/coach-summary", backendBaseUrl);
  } catch {
    return Response.json({ detail: "Coach Summary service is not configured." }, { status: 503 });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);

  try {
    const backendResponse = await fetch(backendEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      cache: "no-store",
      signal: controller.signal,
    });

    return new Response(backendResponse.body, {
      status: backendResponse.status,
      headers: {
        "Content-Type": backendResponse.headers.get("content-type") ?? "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "AbortError";
    return Response.json(
      { detail: timedOut ? "Coach Summary service timed out." : "Coach Summary service is unavailable." },
      { status: timedOut ? 504 : 502 },
    );
  } finally {
    clearTimeout(timeoutId);
  }
}