import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { FeedbackMessage } from "../../../components/FeedbackMessage";
import { FormField } from "../../../components/FormField";
import { Icon } from "../../../components/Icon";
import { ApiError, requestVerificationCode, verifyAccount } from "../../../lib/api";

const CODE_LENGTH = 6;

type LocationState = {
  identifier?: string;
  toast?: string;
  redirectTo?: string;
};

export function VerifyAccount() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const locationState = (location.state as LocationState | null) ?? undefined;

  const initialIdentifier =
    locationState?.identifier ?? searchParams.get("identifier") ?? "";

  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [codeDigits, setCodeDigits] = useState<string[]>(
    Array.from({ length: CODE_LENGTH }, () => "")
  );
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(
    locationState?.toast ?? null
  );
  const [error, setError] = useState<string | null>(null);

  const trimmedIdentifier = identifier.trim();
  const code = useMemo(() => codeDigits.join(""), [codeDigits]);

  const identifierLabel = useMemo(() => {
    if (!trimmedIdentifier) return "contact";
    return trimmedIdentifier.includes("@") ? "email" : "phone number";
  }, [trimmedIdentifier]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const timeout = setTimeout(() => setResendTimer((prev) => prev - 1), 1000);
    return () => clearTimeout(timeout);
  }, [resendTimer]);

  function updateDigit(index: number, nextValue: string) {
    const sanitized = nextValue.replace(/[^0-9]/g, "").slice(-1);
    setCodeDigits((prev) => {
      const next = [...prev];
      next[index] = sanitized;
      return next;
    });
    if (sanitized && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      if (codeDigits[index]) {
        updateDigit(index, "");
        return;
      }
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        setCodeDigits((prev) => {
          const next = [...prev];
          next[index - 1] = "";
          return next;
        });
      }
    }
    if (event.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  const canSubmit = trimmedIdentifier && code.length === CODE_LENGTH;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      setError("Enter the code we sent and the email or phone associated with your account.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setFeedback(null);

    verifyAccount({ identifier: trimmedIdentifier, code })
      .then((response) => {
        setFeedback(response.detail || "Account verified successfully!");
        const redirectTo = locationState?.redirectTo ?? (trimmedIdentifier.includes("@") ? "/login/seeker" : "/login/owner");
        setTimeout(() => {
          navigate(redirectTo, {
            replace: true,
            state: { toast: "Verification complete! Please log in." },
          });
        }, 1200);
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError) {
          setError(err.message || "We couldn't verify that code. Try again.");
        } else {
          setError("Something went wrong. Please try again.");
        }
      })
      .finally(() => setSubmitting(false));
  }

  function handleResend() {
    if (!trimmedIdentifier) {
      setError("Enter the email or phone number you used when signing up.");
      return;
    }
    setResending(true);
    setError(null);

    requestVerificationCode({ identifier: trimmedIdentifier })
      .then((response) => {
        setFeedback(response.detail || "A fresh verification code is on the way!");
        setResendTimer(60);
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError) {
          setError(err.message || "We couldn't send a new code right now.");
        } else {
          setError("We couldn't send a new code right now. Please try again.");
        }
      })
      .finally(() => setResending(false));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <header className="space-y-3 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-[color:var(--brand)]/10 px-4 py-1 text-xs font-medium uppercase tracking-wider text-[color:var(--brand)]">
          <Icon name="sparkles" className="h-4 w-4" /> Verify your account
        </span>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-[color:var(--ink)]">Check your {identifierLabel}</h1>
          <p className="text-sm text-gray-500">
            Enter the {CODE_LENGTH}-digit code we sent to your {identifierLabel}. This helps us keep UniConnect safe for everyone.
          </p>
        </div>
      </header>

      <div className="space-y-4">
        <FormField
          label="Email or phone number"
          name="identifier"
          placeholder="you@example.com"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          iconLeft={<Icon name={identifier.includes("@") ? "mail" : "phone"} />}
          autoComplete="email"
        />
        <div>
          <span className="text-sm text-gray-500">Verification code</span>
          <div className="mt-2 flex justify-center gap-3">
            {codeDigits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(event) => updateDigit(index, event.target.value)}
                onKeyDown={(event) => handleKeyDown(index, event)}
                className="h-12 w-12 rounded-2xl border border-gray-200 bg-white text-center text-lg font-semibold text-[color:var(--ink)] shadow-sm focus:border-[color:var(--brand)] focus:outline-none focus:ring-2 focus:ring-[color:var(--brand)]/40"
                aria-label={`Digit ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {feedback ? <FeedbackMessage variant="success" message={feedback} /> : null}
        {error ? <FeedbackMessage variant="error" message={error} /> : null}
      </div>

      <div className="space-y-4">
        <button
          type="submit"
          className={`w-full h-12 rounded-full bg-gradient-to-r from-[color:var(--brand)] to-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/30 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[color:var(--brand)] ${
            !canSubmit || submitting ? "opacity-60" : "hover:brightness-110"
          }`}
          disabled={!canSubmit || submitting}
        >
          {submitting ? "Verifying..." : "Verify account"}
        </button>
        <button
          type="button"
          onClick={handleResend}
          className="w-full h-12 rounded-full border border-[color:var(--brand)] text-[color:var(--brand)] font-semibold transition hover:bg-[color:var(--brand)]/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[color:var(--brand)]"
          disabled={resending || resendTimer > 0}
        >
          {resending
            ? "Sending..."
            : resendTimer > 0
            ? `Resend code in ${resendTimer}s`
            : "Send a new code"}
        </button>
      </div>

      <p className="text-center text-sm text-gray-500">
        Having trouble?{' '}
        <button
          type="button"
          onClick={() => navigate("/", { replace: false })}
          className="font-semibold text-[color:var(--brand)] hover:underline"
        >
          Return to start
        </button>
      </p>
    </form>
  );
}
