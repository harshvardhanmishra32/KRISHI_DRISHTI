/**
 * Krishi Drishti - Unified API Client (P23).
 * Automatically injects JWT Bearer token, enforces 10s timeouts, handles 401 redirects,
 * converts standardized backend error schemas, and retries GET requests once.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

class ApiError extends Error {
  constructor(message, code = "API_ERROR", status = 500) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

export async function apiRequest(endpoint, options = {}, retries = 1) {
  const url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint}`;
  const token = typeof window !== "undefined" ? localStorage.getItem("krishi_token") : null;

  const headers = {
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Do not set Content-Type if sending FormData (let browser set multipart boundary)
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout for AI + TTS pipelines

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    // Handle 401 Unauthorized -> redirect to login
    if (response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("krishi_token");
        localStorage.removeItem("krishi_user");
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
      }
      throw new ApiError("Session expired. Please log in again.", "UNAUTHORIZED", 401);
    }

    if (!response.ok) {
      let errData = {};
      try {
        errData = await response.json();
      } catch (e) {
        // Not JSON
      }

      const code = errData?.error?.code || "HTTP_ERROR";
      const message =
        errData?.error?.message ||
        `Server returned ${response.status}: ${response.statusText}`;

      throw new ApiError(message, code, response.status);
    }

    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (err) {
    clearTimeout(timeoutId);

    if (err.name === "AbortError") {
      throw new ApiError("Network request timed out (10s). Please check your internet connection.", "TIMEOUT", 408);
    }

    // Auto-retry GET requests once on network failure
    const method = (options.method || "GET").toUpperCase();
    if (method === "GET" && retries > 0) {
      return apiRequest(endpoint, options, retries - 1);
    }

    if (err instanceof ApiError) {
      throw err;
    }

    throw new ApiError(
      err.message || "Unable to reach server. Please ensure backend is running.",
      "NETWORK_ERROR",
      503
    );
  }
}

export const api = {
  get: (endpoint, options = {}) => apiRequest(endpoint, { ...options, method: "GET" }),
  post: (endpoint, body, options = {}) => {
    const isFormData = body instanceof FormData;
    return apiRequest(endpoint, {
      ...options,
      method: "POST",
      body: isFormData ? body : JSON.stringify(body),
    });
  },
  put: (endpoint, body, options = {}) =>
    apiRequest(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    }),
  delete: (endpoint, options = {}) =>
    apiRequest(endpoint, { ...options, method: "DELETE" }),
};
