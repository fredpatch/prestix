// Every dialog/form in this app already extracts errors the same way:
// (err as {response?:{data?:{message?:string}}})?.response?.data?.message
// This just centralizes that exact pattern into one function, so the
// React Query mutation defaults (and any component that wants it) don't
// each repeat the same inline cast. Doesn't change what any existing
// component does today — this is additive, existing try/catch blocks are
// untouched until Phase 3 migrates them.
export function getApiErrorMessage(error: unknown, fallback = "Une erreur est survenue."): string {
  const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
  return message ?? fallback;
}

// Same shape, but returns the raw error CODE (e.g. "INSUFFICIENT_STOCK")
// rather than the server's message — for callers that maintain their own
// code-to-translated-message map (a pattern already used in a few places,
// e.g. IssueInvoiceDialog's ERROR_MESSAGES).
export function getApiErrorCode(error: unknown): string | undefined {
  return (error as { response?: { data?: { code?: string } } })?.response?.data?.code;
}
