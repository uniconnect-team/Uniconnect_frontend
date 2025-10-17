import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FormField } from "../../../components/FormField";
import { FeedbackMessage } from "../../../components/FeedbackMessage";
import { Icon } from "../../../components/Icon";
import { ApiError, login, requestVerificationCode } from "../../../lib/api";
import { validateEmail } from "../../../lib/validators";

export function SeekerLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string | null; password?: string | null }>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [verificationPrompt, setVerificationPrompt] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const toastMessage = (location.state as { toast?: string } | null)?.toast;
    if (toastMessage) {
      setSuccessMessage(toastMessage);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  const isValid = useMemo(() => {
    return !validateEmail(email) && password.length > 0;
  }, [email, password]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccessMessage(null);
    setVerificationPrompt(false);
    const emailError = validateEmail(email);
    const passwordError = password ? null : "Password is required";

    setErrors({ email: emailError, password: passwordError });

    if (emailError || passwordError) return;

    setSubmitting(true);
    setSubmitError(null);

    login({ identifier: email.trim(), password, remember_me: remember })
      .then((res) => {
        localStorage.setItem("token", res.access);
        navigate("/home");
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError) {
          const message = error.message || "Login failed";
          if (error.status === 403 || message.toLowerCase().includes("verify")) {
            setSubmitError("Please verify your UniConnect account before logging in.");
            setVerificationPrompt(true);
          } else {
            setSubmitError(message);
          }
        } else {
          setSubmitError("Something went wrong. Please try again.");
        }
      })
      .finally(() => setSubmitting(false));
  }

  function handleResend() {
    const trimmedEmail = email.trim();
    const emailError = validateEmail(trimmedEmail);
    if (emailError) {
      setErrors((prev) => ({ ...prev, email: emailError }));
      return;
    }

    setResending(true);
    setSubmitError(null);

    requestVerificationCode({ identifier: trimmedEmail })
      .then((response) => {
        setSuccessMessage(response.detail || "Verification code sent! Check your inbox.");
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError) {
          setSubmitError(error.message || "We couldn't resend the code just now.");
        } else {
          setSubmitError("We couldn't resend the code just now. Try again later.");
        }
      })
      .finally(() => {
        setVerificationPrompt(true);
        setResending(false);
      });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <header className="flex items-center justify-between">
        <button type="button" className="flex items-center gap-2 text-sm text-gray-500" onClick={() => navigate(-1)}>
          <Icon name="chevron-left" /> Back
        </button>
        <span className="text-xs font-semibold uppercase tracking-widest text-[color:var(--brand)]">Seeker login</span>
        <span className="w-5" aria-hidden="true" />
      </header>

      <div className="rounded-3xl bg-gray-50 p-6">
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold text-[color:var(--ink)]">Welcome back, seeker</h1>
          <p className="text-sm text-gray-500">
            Sign in to pick up where you left off, manage saved dorms, and message verified owners in real time.
          </p>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-4 text-center text-xs text-gray-500">
          <div className="rounded-2xl bg-white p-3 shadow-sm">
            <p className="font-semibold text-[color:var(--ink)]">120+</p>
            <p>Dorm partners</p>
          </div>
          <div className="rounded-2xl bg-white p-3 shadow-sm">
            <p className="font-semibold text-[color:var(--ink)]">3k</p>
            <p>Happy seekers</p>
          </div>
          <div className="rounded-2xl bg-white p-3 shadow-sm">
            <p className="font-semibold text-[color:var(--ink)]">24/7</p>
            <p>Support</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <FormField
          label="Email"
          name="email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          iconLeft={<Icon name="mail" />}
          error={errors.email}
          autoComplete="email"
        />
        <FormField
          label="Password"
          name="password"
          type={showPassword ? "text" : "password"}
          placeholder="Enter your password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          iconLeft={<Icon name="lock" />}
          iconRight={<Icon name={showPassword ? "eye-off" : "eye"} />}
          onRightIconClick={() => setShowPassword((prev) => !prev)}
          rightIconAriaLabel={showPassword ? "Hide password" : "Show password"}
          error={errors.password}
          autoComplete="current-password"
        />
        <label className="flex items-center gap-3 text-sm text-gray-500">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-[color:var(--brand)] focus:ring-[color:var(--brand)]"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
          />
          Remember me on this device
        </label>
      </div>

      <div className="space-y-3">
        {successMessage ? <FeedbackMessage variant="success" message={successMessage} /> : null}
        {submitError ? (
          <FeedbackMessage
            variant="error"
            message={submitError}
            action={
              verificationPrompt ? (
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      navigate("/verify", {
                        state: {
                          identifier: email.trim(),
                          redirectTo: "/login/seeker",
                        },
                      })
                    }
                    className="inline-flex items-center gap-2 rounded-full bg-[color:var(--brand)] px-3 py-1.5 text-xs font-semibold text-white shadow"
                  >
                    <Icon name="sparkles" className="h-4 w-4" /> Enter verification code
                  </button>
                  <button
                    type="button"
                    onClick={handleResend}
                    className="text-xs font-medium text-[color:var(--brand)] hover:underline"
                    disabled={resending}
                  >
                    {resending ? "Sending..." : "Resend code"}
                  </button>
                </div>
              ) : null
            }
          />
        ) : null}
      </div>

      <button
        type="submit"
        className={`w-full h-12 rounded-full bg-gradient-to-r from-[color:var(--brand)] via-emerald-500 to-sky-500 text-white font-semibold shadow-lg shadow-emerald-500/30 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[color:var(--brand)] ${
          isValid && !submitting ? "hover:brightness-110" : "opacity-60"
        }`}
        disabled={!isValid || submitting}
        aria-busy={submitting}
      >
        {submitting ? "Logging in..." : "Login"}
      </button>

      <div className="text-center space-y-2 text-sm">
        <p className="text-gray-500">
          Don’t have an account?{' '}
          <Link to="/verify-email" className="text-[var(--brand)] font-medium">
            Sign up Now
          </Link>
        </p>
        <a href="#" className="font-semibold text-[color:var(--brand)]">
          Forgot password?
        </a>
      </div>
    </form>
  );
}
