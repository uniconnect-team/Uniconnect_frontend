import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FormField } from "../../../components/FormField";
import { FeedbackMessage } from "../../../components/FeedbackMessage";
import { Icon } from "../../../components/Icon";
import { ApiError, completeProfile, getMe } from "../../../lib/api";
import { validateEmail, validateLength } from "../../../lib/validators";
import type { OwnerProfileCompletionBody, ProfileCompletionResponse } from "../../../lib/types";

export function OwnerCompleteProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login/owner", { replace: true });
      return;
    }

    getMe()
      .then((user) => {
        if (user.role !== "OWNER") {
          navigate("/choose-role", { replace: true });
          return;
        }
        
        if (user.profile_completed) {
          navigate("/owners/dashboard", { replace: true });
          return;
        }
        
        setFullName(user.full_name || "");
        setPhone(user.phone || "");
        setEmail(user.email || "");
        setLoading(false);
      })
      .catch(() => {
        navigate("/login/owner", { replace: true });
      });
  }, [navigate]);

  const isValid = useMemo(() => {
    const trimmedFullName = fullName.trim();
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();
    
    const fullNameValid = trimmedFullName.length >= 1 && trimmedFullName.length <= 200;
    const phoneValid = trimmedPhone.length >= 6 && trimmedPhone.length <= 20;
    const emailValid = !validateEmail(trimmedEmail);

    return fullNameValid && phoneValid && emailValid;
  }, [fullName, phone, email]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedFullName = fullName.trim();
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();

    const fullNameError = validateLength(trimmedFullName, {
      min: 1,
      max: 200,
      message: "Full name must be between 1 and 200 characters",
    });
    const phoneError = validateLength(trimmedPhone, {
      min: 6,
      max: 20,
      message: "Phone number must be 6-20 characters",
    });
    const emailError = validateEmail(trimmedEmail);

    const nextErrors = {
      fullName: fullNameError,
      phone: phoneError,
      email: emailError,
    };

    setErrors(nextErrors);
    setFormError(null);

    if (fullNameError || phoneError || emailError) {
      return;
    }

    setSubmitting(true);

    completeProfile({
      full_name: trimmedFullName,
      phone: trimmedPhone,
      email: trimmedEmail.toLowerCase(),
    })
      .then((user) => {
        const homePath = user.default_home_path || "/owners/dashboard";
        navigate(homePath, { replace: true });
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError) {
          setFormError(error.message || "Unable to complete profile");
        } else {
          setFormError("Unable to complete profile. Please try again.");
        }
      })
      .finally(() => setSubmitting(false));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-[color:var(--brand)] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Complete Your Profile</h1>
        <p className="text-sm text-gray-500">
          Please review and complete your contact information
        </p>
      </header>

      <div className="space-y-4 rounded-2xl bg-gradient-to-br from-[color:var(--brand)]/10 to-purple-50 p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm flex-shrink-0">
            <Icon name="building" className="w-5 h-5 text-[color:var(--brand)]" />
          </div>
          <div className="space-y-1">
            <p className="font-medium text-[color:var(--ink)]">Dormitory Owner Account</p>
            <p className="text-xs text-gray-600">
              Complete your profile to start managing your properties
            </p>
          </div>
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
          placeholder="Enter your email address"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          iconLeft={<Icon name="mail" />}
          error={errors.email}
          autoComplete="email"
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
        {submitting ? "Completing..." : "Complete Profile"}
      </button>

      <p className="text-center text-xs text-gray-500">
        This information will be visible to students looking for accommodation
      </p>
    </form>
  );
}