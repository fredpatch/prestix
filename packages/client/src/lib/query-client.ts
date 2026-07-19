import { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "./api-error";

// Sensible defaults for a business app, not a real-time feed:
// - staleTime avoids re-fetching the same data on every component mount
// - retry: 1 avoids hammering a genuinely failing endpoint
// - refetchOnWindowFocus stays on (default) — good fit here, since a lot of
//   this app's value is "did something change since I last looked" (créances,
//   dashboard numbers, stock levels) when a user tabs back in.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
    mutations: {
      // Centralized mutation error → toast, so individual components don't
      // each need their own try/catch + setError just to surface a failure.
      // Components can still override with their own onError when they need
      // more specific handling (e.g. mapping a code to a translated message).
      onError: (error) => {
        toast.error(getApiErrorMessage(error));
      },
    },
  },
});
