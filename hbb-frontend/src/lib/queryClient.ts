// lib/queryClient.ts
import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
  options?: RequestInit,
  signal?: AbortSignal,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : undefined,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
    signal,
    ...options,
  });

  if (signal?.aborted) throw new Error("Request aborted");
  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

/**
 * Generate a query function for React Query that handles 401 responses gracefully
 */
export const getQueryFn = <T>({ on401 }: { on401: UnauthorizedBehavior }): QueryFunction<T> => {
  return async ({ queryKey }) => {
    const url = queryKey[0] as string;
    const res = await fetch(url, { credentials: "include" });

    if (on401 === "returnNull" && res.status === 401) {
      return null as unknown as T;
    }

    await throwIfResNotOk(res);
    return res.json();
  };
};

// Instantiate a React Query client with defaults tailored for Next.js
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
