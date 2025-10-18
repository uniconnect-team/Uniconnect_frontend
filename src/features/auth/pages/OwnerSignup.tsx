import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FormField } from "../../../components/FormField";
import { FeedbackMessage } from "../../../components/FeedbackMessage";
import { Icon } from "../../../components/Icon";
import type { IconName } from "../../../components/Icon";
import { ApiError, registerOwner } from "../../../lib/api";
import { validateEmail, validateLength, validatePassword, validateRequired } from "../../../lib/validators";

export function OwnerSignup() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const passwordLiveError = password ? validatePassword(password) : null;

  const isValid = useMemo(() => {
    const trimmedFullName = fullName.trim();
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();
    const trimmedAccessCode = accessCode.trim();

    const fullNameValid = trimmedFullName.length >= 1 && trimmedFullName.length <= 80;
    const phoneValid = trimmedPhone.length >= 6 && trimmedPhone.length <= 18;
    const emailValid = !validateEmail(trimmedEmail);
    const passwordValid = !validatePassword(password);
    const accessCodeValid = trimmedAccessCode.length > 0;

    return fullNameValid && phoneValid && emailValid && passwordValid && accessCodeValid;
  }, [fullName, phone, email, password, accessCode]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedFullName = fullName.trim();
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();
    const normalizedEmail = trimmedEmail.toLowerCase();
    const trimmedAccessCode = accessCode.trim();

    const fullNameError = validateLength(trimmedFullName, {
      min: 1,
      max: 80,
      message: "Full name must be between 1 and 80 characters",
    });
    const phoneError = validateLength(trimmedPhone, {
      min: 6,
      max: 18,
      message: "Phone number must be 6-18 characters",
    });
    const emailError = validateEmail(trimmedEmail);
    const passwordError = validatePassword(password ?? "");
    const accessCodeError = validateRequired(trimmedAccessCode, "Access code is required");

    const nextErrors = {
      fullName: fullNameError,
      phone: phoneError,
      email: emailError,
      password: passwordError,
      accessCode: accessCodeError,
    } as const;

    setErrors(nextErrors);
    setFormError(null);

    if (fullNameError || phoneError || emailError || passwordError || accessCodeError) {
      return;
    }

    setSubmitting(true);

    registerOwner({
      full_name: trimmedFullName,
      phone: trimmedPhone,
      email: normalizedEmail,
      password,
      access_code: trimmedAccessCode,
    })
      .then(() => {
        navigate("/login/owner", {
          replace: true,
          state: { toast: "Account created" },
        });
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError) {
          setFormError(error.message || "Unable to create account");
        } else {
          setFormError("Unable to create account. Please try again.");
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
        <h1 className="text-lg font-semibold text-center flex-1">Dormitory Owner Sign Up</h1>
        <span className="w-5" aria-hidden="true" />
      </header>

      <div
        className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 p-5 text-white/80"
        aria-hidden="true"
      >
        <div className="grid h-full grid-cols-3 gap-4">
          {(["building", "briefcase", "key", "sparkles", "users", "calendar"] as IconName[]).map((icon) => (
            <div key={icon} className="flex items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
              <Icon name={icon} className="h-8 w-8" />
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute -right-8 -bottom-12 text-white/10">
          <Icon name="globe" className="h-40 w-40" />
        </div>
      </div>

      <div className="space-y-4">
        <FormField
          label="Full Name"
          name="fullName"
          placeholder="Enter your full name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          iconLeft={<Icon name="user" />}
          error={errors.fullName}
          autoComplete="name"
        />
        <FormField
          label="Phone Number"
          name="phone"
          type="tel"
          placeholder="Enter your phone number"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          iconLeft={<Icon name="phone" />}
          error={errors.phone}
          autoComplete="tel"
        />
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
          placeholder="Create a password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          iconLeft={<Icon name="lock" />}
          iconRight={<Icon name={showPassword ? "eye-off" : "eye"} />}
          onRightIconClick={() => setShowPassword((prev) => !prev)}
          rightIconAriaLabel={showPassword ? "Hide password" : "Show password"}
          error={errors.password ?? passwordLiveError}
          autoComplete="new-password"
        />
        <FormField
          label="Owner Access Code"
          name="accessCode"
          placeholder="Enter the provided access code"
          value={accessCode}
          onChange={(event) => setAccessCode(event.target.value)}
          iconLeft={<Icon name="key" />}
          error={errors.accessCode}
          autoComplete="off"
        />
      </div>

      {formError ? <FeedbackMessage variant="error" message={formError} /> : null}

      <button
        type="submit"
        className={`w-full h-12 rounded-full font-semibold transition focus:outline-none focus:ring-2 focus:ring-[color:var(--brand)] focus:ring-offset-2 ${
          isValid && !submitting ? "bg-[color:var(--brand)] text-white" : "bg-gray-200 text-gray-400"
        }`}
        disabled={!isValid || submitting}
        aria-busy={submitting}
      >
        {submitting ? "Creating..." : "Sign up"}
      </button>

      <div className="text-center space-y-2 text-sm">
        <p className="text-gray-500">
          Already have an account?{" "}
          <Link to="/login/owner" className="text-[var(--brand)] font-medium">
            Enter here
          </Link>
        </p>
        <a href="#" className="text-gray-400">
          Privacy Policy
        </a>
      </div>
    </form>
  );
}
