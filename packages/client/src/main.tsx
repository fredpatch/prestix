import "./styles/index.css";
import "./i18n";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./lib/theme";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { queryClient } from "./lib/query-client";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
        {/* Brand-consistent position/styling applied via toastOptions rather
            than per-toast — every call site just does toast.success(...)/
            toast.error(...) and inherits this look. */}
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            style: { fontFamily: "var(--font-sans)" },
          }}
        />
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
