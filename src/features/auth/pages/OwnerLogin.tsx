import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FormField } from "../../../components/FormField";
import { FeedbackMessage } from "../../../components/FeedbackMessage";
import { Icon } from "../../../components/Icon";
import { ApiError, login } from "../../../lib/api";
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

  const isValid = useMemo(() => phone.trim().length > 0 && password.length > 0, [phone, password]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const phoneError = validateRequired(phone.trim(), "Phone number is required");
    const passwordError = password ? null : "Password is required";

    setErrors({ phone: phoneError, password: passwordError });

    if (phoneError || passwordError) return;

    setSubmitting(true);
    setSubmitError(null);

    login({ identifier: phone.trim(), password, remember_me: remember })
      .then((res) => {
        localStorage.setItem("token", res.access);
        navigate("/home");
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError) {
          setSubmitError(error.message || "Login failed");
        } else {
          setSubmitError("Something went wrong. Please try again.");
        }
      })
      .finally(() => setSubmitting(false));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <header className="flex items-center justify-between">
        <button type="button" className="text-gray-500" onClick={() => navigate(-1)}>
          <Icon name="chevron-left" />
        </button>
        <h1 className="text-lg font-semibold text-center flex-1">Dormitory Owner Login</h1>
        <span className="w-5" aria-hidden="true" />
      </header>

      <div className="space-y-4">
        <FormField
          label="Phone Number"
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
          placeholder="Enter Your Password"
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
          Remember Password
        </label>
      </div>

      {submitError ? <FeedbackMessage variant="error" message={submitError} /> : null}

      <button
        type="submit"
        className={`w-full h-12 rounded-full font-semibold transition focus:outline-none focus:ring-2 focus:ring-[color:var(--brand)] focus:ring-offset-2 ${
          isValid && !submitting ? "bg-[color:var(--brand)] text-white" : "bg-gray-200 text-gray-400"
        }`}
        disabled={!isValid || submitting}
        aria-busy={submitting}
      >
        {submitting ? "Logging in..." : "Login"}
      </button>

      <div className="text-center space-y-2 text-sm">
        <p className="text-gray-500">
          Don’t have an account?{' '}
          <Link to="/signup" className="text-[var(--brand)] font-medium">
            Sign up Now
          </Link>
        </p>
        <a href="#" className="text-[var(--brand)] font-medium">
          Forget Password?
        </a>
      </div>
    </form>
  );
}
