import { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FormField } from "../../../components/FormField";
import { FeedbackMessage } from "../../../components/FeedbackMessage";
import { Icon } from "../../../components/Icon";
import { ApiError, requestVerificationCode, verifyAccount } from "../../../lib/api";
import { validateEmail } from "../../../lib/validators";

const allowedDomains = ["aub.edu.lb", "lau.edu.lb"];
const allowedSuffixes = [".edu.lb"];

function deriveDomain(email: string) {
  const [, domain] = email.split("@");
  return domain ? domain.trim().toLowerCase() : "";
}

function validateUniversityEmail(email: string): string | null {
  const normalized = deriveDomain(email);
  if (!normalized) {
    return "Enter a valid university email";
  }

  const matchesDomain = allowedDomains.some((domain) => normalized === domain);
  const matchesSuffix = allowedSuffixes.some((suffix) => normalized.endsWith(suffix));

  if (!matchesDomain && !matchesSuffix) {
    return "Use your official university email (AUB, LAU, .edu.lb)";
  }

  return null;
}

function validateVerificationCode(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return "Enter the verification code";
  }
  if (!/^\d{6}$/.test(trimmed)) {
    return "Verification code must be 6 digits";
  }
  return null;
}

type ErrorState = {
  email?: string | null;
  code?: string | null;
};

type Step = "request" | "confirm";

export function VerifySeekerEmail() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState<ErrorState>({});
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (step === "request") {
      return !validateEmail(email) && !validateUniversityEmail(email);
    }

    return !validateVerificationCode(code);
  }, [email, step, code]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    if (step === "request") {
      const emailError = validateEmail(email);
      const universityError = emailError ? null : validateUniversityEmail(email);

      const nextErrors: ErrorState = {
        email: emailError || universityError,
      };

      setErrors(nextErrors);
      setSuccessMessage(null);
      setErrorMessage(null);

      if (nextErrors.email) {
        return;
      }

      setSubmitting(true);

      requestVerificationCode({ identifier: email })
        .then((response) => {
          setStep("confirm");
          setSuccessMessage(response.detail || "Code sent! Check your inbox.");
          setErrorMessage(null);
        })
        .catch((error: unknown) => {
          if (error instanceof ApiError) {
            setErrorMessage(error.message || "Unable to send code");
          } else {
            setErrorMessage("Unable to send code. Please try again.");
          }
        })
        .finally(() => setSubmitting(false));

      return;
    }

    const codeError = validateVerificationCode(code);

    const nextErrors: ErrorState = {
      code: codeError,
    };

    setErrors(nextErrors);
    setSuccessMessage(null);
    setErrorMessage(null);

    if (codeError) {
      return;
    }

    setSubmitting(true);

    const sanitizedCode = code.trim();

    verifyAccount({ identifier: email, code: sanitizedCode })
      .then((response) => {
        setSuccessMessage(response.detail || "Email verified! Redirecting to sign up...");
        setErrorMessage(null);
        setTimeout(() => {
          navigate("/signup", { state: { verifiedEmail: email } });
        }, 600);
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError) {
          setErrorMessage(error.message || "Unable to verify code");
        } else {
          setErrorMessage("Unable to verify code. Please try again.");
        }
      })
      .finally(() => setSubmitting(false));
  }

  function handleResend() {
    if (resending || submitting || step !== "confirm") return;

    setResending(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    requestVerificationCode({ identifier: email })
      .then((response) => {
        setSuccessMessage(response.detail || "We sent you a new code.");
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError) {
          setErrorMessage(error.message || "Unable to resend code");
        } else {
          setErrorMessage("Unable to resend code. Please try again.");
        }
      })
      .finally(() => setResending(false));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <header className="flex items-center justify-between">
        <button type="button" className="text-gray-500" onClick={() => navigate(-1)}>
          <Icon name="chevron-left" />
        </button>
        <h1 className="text-lg font-semibold text-center flex-1">Verify University Email</h1>
        <span className="w-5" aria-hidden="true" />
      </header>

      <p className="text-sm text-gray-500 leading-relaxed">
        Before creating your Dormitory Seeker account, confirm you belong to an approved university. Enter your university email and we'll send you a verification code.
      </p>

      <div className="space-y-4">
        <FormField
          label="University Email"
          name="email"
          type="email"
          placeholder="name@aub.edu.lb"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          iconLeft={<Icon name="mail" />}
          error={errors.email}
          autoComplete="email"
          readOnly={step === "confirm"}
        />
        {step === "confirm" ? (
          <FormField
            label="Verification Code"
            name="code"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="Enter the 6-digit code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            iconLeft={<Icon name="check-circle" />}
            error={errors.code}
            autoComplete="one-time-code"
          />
        ) : null}
      </div>

      <div className="space-y-3">
        {successMessage ? <FeedbackMessage variant="success" message={successMessage} /> : null}
        {errorMessage ? <FeedbackMessage variant="error" message={errorMessage} /> : null}
      </div>

      <button
        type="submit"
        className={`w-full h-12 rounded-full font-semibold transition focus:outline-none focus:ring-2 focus:ring-[color:var(--brand)] focus:ring-offset-2 ${
          canSubmit && !submitting ? "bg-[color:var(--brand)] text-white" : "bg-gray-200 text-gray-400"
        }`}
        disabled={!canSubmit || submitting}
        aria-busy={submitting}
      >
        {step === "request"
          ? submitting
            ? "Sending code..."
            : "Send verification code"
          : submitting
          ? "Verifying..."
          : "Verify and continue"}
      </button>

      {step === "confirm" ? (
        <p className="text-sm text-gray-500 text-center">
          Didn't receive the code?{' '}
          <button
            type="button"
            onClick={handleResend}
            className="text-[color:var(--brand)] font-medium disabled:opacity-50"
            disabled={resending || submitting}
          >
            {resending ? "Resending..." : "Resend"}
          </button>
        </p>
      ) : null}
    </form>
  );
}
