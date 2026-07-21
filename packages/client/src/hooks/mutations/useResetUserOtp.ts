import { useMutation } from "@tanstack/react-query";
import { usersApi } from "@/lib/users.api";

export function useResetUserOtpMutation() {
  return useMutation({
    mutationFn: (id: number) => usersApi.resetOTP(id),
    // No onSuccess here — the "OTP sent to <email>" toast needs the email,
    // which isn't part of the mutation input; the caller passes its own
    // onSuccess into mutate() for that. Errors fall through to the global
    // toast (previously this call had no catch at all — an unhandled
    // rejection on failure, silently swallowed).
  });
}
