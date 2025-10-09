import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FormField } from "../../../components/FormField";
import { Icon } from "../../../components/Icon";
import { register } from "../../../lib/api";
import { validateEmail, validateLength, validatePassword } from "../../../lib/validators";

export function Signup() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const isValid = useMemo(() => {
    const trimmedFullName = fullName.trim();
    const trimmedPhone = phone.trim();
    const fullNameValid = trimmedFullName.length >= 1 && trimmedFullName.length <= 80;
    const phoneValid = trimmedPhone.length >= 6 && trimmedPhone.length <= 18;
    const emailValid = !validateEmail(email);
    const passwordValid = !validatePassword(password);
    return fullNameValid && phoneValid && emailValid && passwordValid;
  }, [fullName, phone, email, password]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fullNameError = validateLength(fullName.trim(), {
      min: 1,
      max: 80,
      message: "Full name must be between 1 and 80 characters",
    });
    const phoneError = validateLength(phone.trim(), {
      min: 6,
      max: 18,
      message: "Phone number must be 6-18 characters",
    });
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password ?? "");

    const nextErrors = {
      fullName: fullNameError,
      phone: phoneError,
      email: emailError,
      password: passwordError,
    };

    setErrors(nextErrors);
    setFeedback(null);

    if (fullNameError || phoneError || emailError || passwordError) {
      return;
    }

    setSubmitting(true);

    register({
      full_name: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      password,
      role: "SEEKER",
    })
      .then(() => {
        setFeedback("Account created");
        navigate("/login/seeker");
      })
      .catch((error: Error) => {
        setFeedback(error.message || "Unable to sign up");
      })
      .finally(() => setSubmitting(false));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <header className="flex items-center justify-between">
        <button type="button" className="text-gray-500" onClick={() => navigate(-1)}>
          <Icon name="chevron-left" />
        </button>
        <h1 className="text-lg font-semibold text-center flex-1">Sign up Account</h1>
        <span className="w-5" aria-hidden="true" />
      </header>

      <div className="w-full h-36 bg-gray-100 rounded-2xl" aria-hidden="true" />

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
          error={errors.password}
          autoComplete="new-password"
        />
      </div>

      {feedback ? (
        <p className={`text-sm ${feedback === "Account created" ? "text-[color:var(--brand)]" : "text-red-600"}`}>
          {feedback}
        </p>
      ) : null}

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
          Already have a Molly account?{' '}
          <Link to="/login/seeker" className="text-[var(--brand)] font-medium">
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
