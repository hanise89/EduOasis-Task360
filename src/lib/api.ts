// API client for EDUOASIS TASK360 - typed fetch wrapper

export async function api<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      credentials: "include",
    });
  } catch (e: any) {
    // Network error: server unreachable, DNS failure, CORS, etc.
    throw new Error(
      "Tidak dapat hubungkan pelayan. Sila semak sambungan internet anda."
    );
  }

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // Non-JSON response (HTML 500 page, empty body, etc.)
    if (!res.ok) {
      throw new Error(
        res.status === 500
          ? "Ralat pelayan dalaman. Pasukan sokongan telah dimaklumkan."
          : res.status === 503
            ? "Pelayan pangkalan data tidak boleh dihubungi. Sila cuba lagi sebentar."
            : `Ralat ${res.status}`
      );
    }
  }

  if (!res.ok) {
    const msg =
      data?.error ||
      (res.status === 500
        ? "Ralat pelayan dalaman."
        : res.status === 503
          ? "Pelayan pangkalan data tidak boleh dihubungi."
          : res.status === 401
            ? "Tidak dibenarkan."
            : res.status === 403
              ? "Anda tiada akses."
              : res.status === 404
                ? "Rekod tidak dijumpai."
                : `Ralat ${res.status}`);
    throw new Error(msg);
  }
  return data as T;
}

export const apiGet = <T = any>(path: string) => api<T>(path, { method: "GET" });
export const apiPost = <T = any>(path: string, body?: any) =>
  api<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined });
export const apiPatch = <T = any>(path: string, body?: any) =>
  api<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined });
export const apiPut = <T = any>(path: string, body?: any) =>
  api<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined });
export const apiDelete = <T = any>(path: string) => api<T>(path, { method: "DELETE" });
