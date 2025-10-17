import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FormField } from "../../../components/FormField";
import { FeedbackMessage } from "../../../components/FeedbackMessage";
import { Icon } from "../../../components/Icon";
import { ApiError, login, requestVerificationCode } from "../../../lib/api";
import { validateRequired } from "../../../lib/validators";

export function OwnerLogin() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<{ phone?: string | null; password?: string | null }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [verificationPrompt, setVerificationPrompt] = useState(false);
  const [resending, setResending] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isValid = useMemo(() => phone.trim().length > 0 && password.length > 0, [phone, password]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedPhone = phone.trim();
    const phoneError = validateRequired(trimmedPhone, "Phone number is required");
    const passwordError = password ? null : "Password is required";

    setErrors({ phone: phoneError, password: passwordError });

    if (phoneError || passwordError) return;

    setSubmitting(true);
    setSubmitError(null);
    setVerificationPrompt(false);

    login({ identifier: trimmedPhone, password, remember_me: remember })
      .then((res) => {
        localStorage.setItem("token", res.access);
        navigate("/home");
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError) {
          const message = error.message || "Login failed";
          if (error.status === 403 || message.toLowerCase().includes("verify")) {
            setSubmitError("Please verify your owner account before logging in.");
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
    const trimmedPhone = phone.trim();
    const phoneError = validateRequired(trimmedPhone, "Phone number is required");
    if (phoneError) {
      setErrors((prev) => ({ ...prev, phone: phoneError }));
      return;
    }

    setResending(true);
    setSubmitError(null);

    requestVerificationCode({ identifier: trimmedPhone })
      .then((response) => {
        setSuccessMessage(response.detail || "Verification code sent!");
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError) {
          setSubmitError(error.message || "We couldn't resend the code right now.");
        } else {
          setSubmitError("We couldn't resend the code right now. Try again later.");
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
        <span className="text-xs font-semibold uppercase tracking-widest text-[color:var(--brand)]">Owner login</span>
        <span className="w-5" aria-hidden="true" />
      </header>

      <div className="rounded-3xl bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 p-6 text-white shadow-xl">
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold">Welcome back, owner</h1>
          <p className="text-sm text-white/70">
            Manage bookings, review applications, and connect with trusted students instantly.
          </p>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-white/80">
          <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
            <p className="text-2xl font-semibold text-white">98%</p>
            <p>Occupancy success</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
            <p className="text-2xl font-semibold text-white">4.9★</p>
            <p>Average rating</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <FormField
          label="Phone number"
          name="phone"
          type="tel"
          placeholder="Type your number"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          iconLeft={<Icon name="phone" />}
          error={errors.phone}
          autoComplete="tel"
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
                          identifier: phone.trim(),
                          redirectTo: "/login/owner",
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
          <Link to="/signup" className="font-semibold text-[color:var(--brand)]">
            Sign up now
          </Link>
        </p>
        <a href="#" className="font-semibold text-[color:var(--brand)]">
          Forgot password?
        </a>
      </div>
    </form>
  );
}
