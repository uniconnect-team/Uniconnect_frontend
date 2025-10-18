import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FormField } from "../../../components/FormField";
import { FeedbackMessage } from "../../../components/FeedbackMessage";
import { Icon } from "../../../components/Icon";
import type { IconName } from "../../../components/Icon";
import { ApiError, registerOwner } from "../../../lib/api";
import { validateEmail, validateLength, validatePassword, validateRequired } from "../../../lib/validators";

type PropertyFormState = {
  name: string;
  location: string;
};

export function OwnerSignup() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [properties, setProperties] = useState<PropertyFormState[]>([
    { name: "", location: "" },
  ]);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const passwordLiveError = password ? validatePassword(password) : null;

  const isValid = useMemo(() => {
    const trimmedFullName = fullName.trim();
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();
    const trimmedProperties = properties.map(({ name, location }) => ({
      name: name.trim(),
      location: location.trim(),
    }));

    const fullNameValid = trimmedFullName.length >= 1 && trimmedFullName.length <= 80;
    const phoneValid = trimmedPhone.length >= 6 && trimmedPhone.length <= 18;
    const emailValid = !validateEmail(trimmedEmail);
    const passwordValid = !validatePassword(password);
    const hasProperty = trimmedProperties.length > 0;
    const propertiesValid =
      hasProperty &&
      trimmedProperties.every((property) => property.name.length > 0 && property.location.length > 0);

    return fullNameValid && phoneValid && emailValid && passwordValid && propertiesValid;
  }, [fullName, phone, email, password, properties]);

  function updateProperty(index: number, field: keyof PropertyFormState, value: string) {
    setProperties((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function addProperty() {
    setProperties((prev) => [...prev, { name: "", location: "" }]);
  }

  function removeProperty(index: number) {
    setProperties((prev) => prev.filter((_, propertyIndex) => propertyIndex !== index));
    setErrors((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        if (key.startsWith("propertyName-") || key.startsWith("propertyLocation-")) {
          delete next[key];
        }
      });
      return next;
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedFullName = fullName.trim();
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();
    const normalizedEmail = trimmedEmail.toLowerCase();
    const normalizedProperties = properties.map(({ name, location }) => ({
      name: name.trim(),
      location: location.trim(),
    }));

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
    const propertyErrors: Record<string, string | null> = {};
    normalizedProperties.forEach((property, index) => {
      propertyErrors[`propertyName-${index}`] = validateRequired(
        property.name,
        "Property name is required",
      );
      propertyErrors[`propertyLocation-${index}`] = validateRequired(
        property.location,
        "Location is required",
      );
    });

    const nextErrors = {
      fullName: fullNameError,
      phone: phoneError,
      email: emailError,
      password: passwordError,
      ...propertyErrors,
    } satisfies Record<string, string | null>;

    setErrors(nextErrors);
    setFormError(null);

    const hasErrors = Object.values(nextErrors).some(Boolean);
    if (hasErrors) {
      return;
    }

    setSubmitting(true);

    registerOwner({
      full_name: trimmedFullName,
      phone: trimmedPhone,
      email: normalizedEmail,
      password,
      properties: normalizedProperties,
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
        <div className="space-y-3">
          <div>
            <h2 className="text-sm font-medium text-[color:var(--ink)]">Properties you manage</h2>
            <p className="text-xs text-gray-500">Add at least one dormitory with its location.</p>
          </div>
          <div className="space-y-4">
            {properties.map((property, index) => (
              <div key={index} className="rounded-2xl bg-gray-50 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="font-medium text-[color:var(--ink-light)]">Dormitory {index + 1}</span>
                  {properties.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeProperty(index)}
                      className="text-[color:var(--ink-light)] hover:text-red-500 font-medium"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
                <FormField
                  label="Property name"
                  name={`property-name-${index}`}
                  placeholder="e.g. Sunrise Dorms"
                  value={property.name}
                  onChange={(event) => updateProperty(index, "name", event.target.value)}
                  iconLeft={<Icon name="building" />}
                  error={errors[`propertyName-${index}`] ?? null}
                  autoComplete="off"
                />
                <FormField
                  label="Location"
                  name={`property-location-${index}`}
                  placeholder="City or address"
                  value={property.location}
                  onChange={(event) => updateProperty(index, "location", event.target.value)}
                  iconLeft={<Icon name="globe" />}
                  error={errors[`propertyLocation-${index}`] ?? null}
                  autoComplete="off"
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addProperty}
            className="text-sm font-medium text-[color:var(--brand)] hover:underline"
          >
            + Add another property
          </button>
        </div>
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
