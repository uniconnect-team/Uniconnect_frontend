import { FormEvent, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { FormField } from "../../../components/FormField";
import { FeedbackMessage } from "../../../components/FeedbackMessage";
import { Icon } from "../../../components/Icon";
import { ApiError, confirmStudentVerification, register, requestStudentVerification } from "../../../lib/api";

type SignupVerificationState = {
  fullName: string;
  phone: string;
  password: string;
  email: string;
  studentId: string;
  verificationToken: string;
};

function maskEmail(email: string) {
  const [localPart, domain] = email.split("@");
  if (!domain) return email;
  if (localPart.length <= 1) {
    return `${localPart[0] ?? "*"}*@${domain}`;
  }
  const first = localPart[0];
  const last = localPart[localPart.length - 1];
  const masked = "*".repeat(Math.max(localPart.length - 2, 1));
  return `${first}${masked}${last}@${domain}`;
}

export function SeekerVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as SignupVerificationState | null;
  const [verificationToken, setVerificationToken] = useState<string>(locationState?.verificationToken ?? "");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const isValid = useMemo(() => {
    const trimmed = code.trim();
    return /^\d{6}$/.test(trimmed);
  }, [code]);

  if (!locationState) {
    return <Navigate to="/signup" replace />;
  }

  const details = locationState;
  const maskedEmail = maskEmail(details.email);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!verificationToken) {
      setError("We couldn’t find an active verification request. Please resend the code.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setInfo(null);

    const trimmedCode = code.trim();

    confirmStudentVerification({
      verification_token: verificationToken,
      code: trimmedCode,
    })
      .then((response) => {
        if (!response.verified) {
          throw new ApiError("Incorrect verification code.", 400);
        }

        return register({
          full_name: details.fullName,
          phone: details.phone,
          email: details.email,
          password: details.password,
          role: "SEEKER",
          university_email: details.email,
          student_id: details.studentId,
        });
      })
      .then(() => {
        navigate("/login/seeker", {
          replace: true,
          state: { toast: "Account created" },
        });
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError) {
          setError(err.message || "Verification failed. Please try again.");
        } else {
          setError("Verification failed. Please try again.");
        }
      })
      .finally(() => setSubmitting(false));
  }

  function handleResend() {
    setResending(true);
    setError(null);
    setInfo(null);

    requestStudentVerification({
      email: details.email,
      student_id: details.studentId,
    })
      .then(({ verification_token }) => {
        setVerificationToken(verification_token);
        setInfo(`We sent a new code to ${maskedEmail}.`);
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError) {
          setError(err.message || "Unable to resend verification code.");
        } else {
          setError("Unable to resend verification code. Please try again.");
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
        <h1 className="text-lg font-semibold text-center flex-1">Verify student email</h1>
        <span className="w-5" aria-hidden="true" />
      </header>

      <div className="space-y-3 rounded-2xl bg-gray-50 p-5 text-center">
        <Icon name="mail" className="mx-auto h-8 w-8 text-[color:var(--brand)]" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-[color:var(--ink)]">Check your inbox</p>
          <p className="text-sm text-gray-500">
            We sent a 6-digit verification code to <span className="font-medium">{maskedEmail}</span>.
          </p>
        </div>
      </div>

      <FormField
        label="Verification code"
        name="code"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={6}
        placeholder="Enter the 6-digit code"
        value={code}
        onChange={(event) => setCode(event.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
        iconLeft={<Icon name="key" />}
        autoComplete="one-time-code"
      />

      {error ? <FeedbackMessage variant="error" message={error} /> : null}
      {info ? <FeedbackMessage variant="success" message={info} /> : null}

      <button
        type="submit"
        className={`w-full h-12 rounded-full font-semibold transition focus:outline-none focus:ring-2 focus:ring-[color:var(--brand)] focus:ring-offset-2 ${
          isValid && !submitting ? "bg-[color:var(--brand)] text-white" : "bg-gray-200 text-gray-400"
        }`}
        disabled={!isValid || submitting}
        aria-busy={submitting}
      >
        {submitting ? "Verifying..." : "Verify and continue"}
      </button>

      <div className="space-y-3 text-center text-sm text-gray-500">
        <button
          type="button"
          className="font-medium text-[color:var(--brand)] disabled:opacity-50"
          onClick={handleResend}
          disabled={resending}
        >
          {resending ? "Sending new code..." : "Resend code"}
        </button>
        <p>
          Wrong email?{' '}
          <button type="button" className="font-medium" onClick={() => navigate(-1)}>
            Go back
          </button>
        </p>
      </div>
    </form>
  );
}
