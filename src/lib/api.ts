/**
 * Browser: same-origin proxy `/api/backend/*` → Express (avoids CORS / wrong URL).
 * Server: direct backend URL when set, else internal URL + `/api`.
 */
export function getApiBase(): string {
  const publicUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (publicUrl) return publicUrl.replace(/\/$/, "");

  const internal = (
    process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:5000"
  ).replace(/\/$/, "");
  return `${internal}/api`;
}

export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (typeof window !== "undefined") {
    return `/api/backend${p}`;
  }
  return `${getApiBase()}${p}`;
}

/** User-facing hint when fetch fails (network / backend down). */
export function networkErrorMessage(err: unknown): string {
  if (err instanceof TypeError && String(err.message).includes("fetch")) {
    return "Could not reach the server. Start the API (e.g. port 5000) and restart Next.js after changing .env.";
  }
  return err instanceof Error ? err.message : "Something went wrong.";
}
