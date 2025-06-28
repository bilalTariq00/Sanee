// lib/fetcher.ts
export async function fetcher<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, credentials: "include" }); // keep cookies if your API is auth-protected
  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(err || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}
