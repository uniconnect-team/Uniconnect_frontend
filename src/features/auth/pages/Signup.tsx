import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FormField } from "../../../components/FormField";
import { FeedbackMessage } from "../../../components/FeedbackMessage";
import { Icon } from "../../../components/Icon";
import type { IconName } from "../../../components/Icon";
import { ApiError, register, requestVerificationCode } from "../../../lib/api";
import { validateEmail, validateLength, validatePassword } from "../../../lib/validators";

const heroIcons: IconName[] = ["users", "building", "messages-square", "briefcase", "calendar", "sparkles"];

const highlights: Array<{ icon: IconName; title: string; description: string }> = [
  {
    icon: "sparkles",
    title: "Verified spaces",
    description: "Every listing is vetted with the UniConnect community standards before it goes live.",
  },
  {
    icon: "users",
    title: "Roommate ready",
    description: "Share preferences and get paired with people who match your lifestyle instantly.",
  },
  {
    icon: "globe",
    title: "Campus connected",
    description: "Stay close to campus life with curated dorms, amenities, and events in your area.",
  },
];

export function Signup() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isValid = useMemo(() => {
    const trimmedFullName = fullName.trim();
    const trimmedPhone = phone.trim();
    const fullNameValid = trimmedFullName.length >= 1 && trimmedFullName.length <= 80;
    const phoneValid = trimmedPhone.length >= 6 && trimmedPhone.length <= 18;
    const emailValid = !validateEmail(email);
    const passwordValid = !validatePassword(password);
    return fullNameValid && phoneValid && emailValid && passwordValid;
  }, [fullName, phone, email, password]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedFullName = fullName.trim();
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();

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

    const nextErrors = {
      fullName: fullNameError,
      phone: phoneError,
      email: emailError,
      password: passwordError,
    };

    setErrors(nextErrors);
    setFormError(null);

    if (fullNameError || phoneError || emailError || passwordError) {
      return;
    }

    setSubmitting(true);

    try {
      await register({
        full_name: trimmedFullName,
        phone: trimmedPhone,
        email: trimmedEmail,
        password,
        role: "SEEKER",
      });

      let toast = "Account created! Enter the code we just sent.";
      try {
        const response = await requestVerificationCode({ identifier: trimmedEmail });
        toast = response.detail || toast;
      } catch (error: unknown) {
        if (error instanceof ApiError && error.message) {
          toast = `${toast} (${error.message})`;
        }
      }

      navigate("/verify", {
        replace: true,
        state: {
          identifier: trimmedEmail,
          toast,
          redirectTo: "/login/seeker",
        },
      });
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        setFormError(error.message || "Unable to sign up");
      } else {
        setFormError("Unable to sign up. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <header className="flex items-center justify-between">
        <button type="button" className="flex items-center gap-2 text-sm text-gray-500" onClick={() => navigate(-1)}>
          <Icon name="chevron-left" />
          Back
        </button>
        <span className="text-xs font-medium uppercase tracking-widest text-[color:var(--brand)]">Create account</span>
        <span className="w-5" aria-hidden="true" />
      </header>

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[color:var(--brand)] via-emerald-500 to-sky-500 p-6 text-white shadow-xl">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-white/70">Welcome to UniConnect</p>
          <h1 className="text-2xl font-semibold">Let's unlock housing made for students</h1>
          <p className="text-sm text-white/80">
            One profile gives you access to curated dorms, smart roommate matching, and verified owners.
          </p>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-4 text-white/90">
          {heroIcons.map((icon, index) => (
            <div
              key={`${icon}-${index}`}
              className="flex h-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm"
            >
              <Icon name={icon} className="h-8 w-8" />
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute -right-12 -bottom-16 text-white/20">
          <Icon name="globe" className="h-48 w-48" />
        </div>
      </div>

      <div className="space-y-4">
        <FormField
          label="Full name"
          name="fullName"
          placeholder="Enter your full name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          iconLeft={<Icon name="user" />}
          error={errors.fullName}
          autoComplete="name"
        />
        <FormField
          label="Phone number"
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
          error={errors.password}
          autoComplete="new-password"
        />
      </div>

      {formError ? <FeedbackMessage variant="error" message={formError} /> : null}

      <button
        type="submit"
        className={`w-full h-12 rounded-full bg-gradient-to-r from-[color:var(--brand)] via-emerald-500 to-sky-500 text-white font-semibold shadow-lg shadow-emerald-500/40 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[color:var(--brand)] ${
          isValid && !submitting ? "hover:brightness-110" : "opacity-60"
        }`}
        disabled={!isValid || submitting}
        aria-busy={submitting}
      >
        {submitting ? "Creating..." : "Sign up"}
      </button>

      <div className="space-y-3 text-sm text-gray-500">
        <p className="text-center">
          Already have an account?{' '}
          <Link to="/login/seeker" className="font-semibold text-[color:var(--brand)]">
            Enter here
          </Link>
        </p>
        <a href="#" className="block text-center text-gray-400 hover:text-gray-500">
          Privacy Policy
        </a>
      </div>

      <ul className="space-y-3 rounded-3xl bg-gray-50 p-5 text-sm text-gray-600">
        {highlights.map((highlight) => (
          <li key={highlight.title} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl bg-[color:var(--brand)]/10 text-[color:var(--brand)]">
              <Icon name={highlight.icon} />
            </span>
            <div>
              <p className="font-medium text-[color:var(--ink)]">{highlight.title}</p>
              <p>{highlight.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </form>
  );
}
