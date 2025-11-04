import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FormField } from "../../../components/FormField";
import { FeedbackMessage } from "../../../components/FeedbackMessage";
import { Icon } from "../../../components/Icon";
import { ApiError, completeProfile, getMe } from "../../../lib/api";
import { validateLength, validateRequired } from "../../../lib/validators";
import type { SeekerProfileCompletionBody } from "../../../lib/types";

export function SeekerCompleteProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "">("");
  const [universityEmail, setUniversityEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login/seeker", { replace: true });
      return;
    }

    getMe()
      .then((user) => {
        if (user.role !== "SEEKER") {
          navigate("/choose-role", { replace: true });
          return;
        }
        
        if (user.profile_completed) {
          const homePath = user.default_home_path || "/seekers/home";
          localStorage.setItem("defaultHomePath", homePath);
          navigate(homePath, { replace: true });
          return;
        }
        
        setFullName(user.full_name || "");
        setPhone(user.phone || "");
        setUniversityEmail(user.email || "");
        setLoading(false);
      })
      .catch(() => {
        navigate("/login/seeker", { replace: true });
      });
  }, [navigate]);

  const isValid = useMemo(() => {
    const trimmedFullName = fullName.trim();
    const trimmedPhone = phone.trim();
    
    const fullNameValid = trimmedFullName.length >= 1 && trimmedFullName.length <= 200;
    const phoneValid = trimmedPhone.length >= 6 && trimmedPhone.length <= 20;
    const dateValid = dateOfBirth.length > 0;
    const genderValid = gender === "MALE" || gender === "FEMALE";

    return fullNameValid && phoneValid && dateValid && genderValid;
  }, [fullName, phone, dateOfBirth, gender]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedFullName = fullName.trim();
    const trimmedPhone = phone.trim();

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
    const dateError = validateRequired(dateOfBirth, "Date of birth is required");
    const genderError = validateRequired(gender, "Gender is required");

    const nextErrors = {
      fullName: fullNameError,
      phone: phoneError,
      dateOfBirth: dateError,
      gender: genderError,
    };

    setErrors(nextErrors);
    setFormError(null);

    if (fullNameError || phoneError || dateError || genderError) {
      return;
    }

    setSubmitting(true);

    const profileData: SeekerProfileCompletionBody = {
      full_name: trimmedFullName,
      phone: trimmedPhone,
      date_of_birth: dateOfBirth,
      gender: gender as "MALE" | "FEMALE",
    };

    completeProfile(profileData)
      .then((user) => {
        const homePath = user.default_home_path || "/seekers/home";
        localStorage.setItem("defaultHomePath", homePath);
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
          Please review and complete the following information
        </p>
      </header>

      <div className="space-y-4 rounded-2xl bg-gray-50 p-4">
        <div className="space-y-1">
          <p className="font-medium text-[color:var(--ink)]">University Information</p>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Icon name="graduation-cap" className="w-4 h-4" />
            <span>{universityEmail}</span>
          </div>
          <p className="text-xs text-gray-500">
            Your university email has been verified
          </p>
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
          label="Date of Birth"
          name="dateOfBirth"
          type="date"
          placeholder="Select your date of birth"
          value={dateOfBirth}
          onChange={(event) => setDateOfBirth(event.target.value)}
          iconLeft={<Icon name="calendar" />}
          error={errors.dateOfBirth}
          autoComplete="bday"
        />
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Gender
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="gender"
                value="MALE"
                checked={gender === "MALE"}
                onChange={(e) => setGender(e.target.value as "MALE")}
                className="h-4 w-4 text-[color:var(--brand)] focus:ring-[color:var(--brand)]"
              />
              <span className="text-sm">Male</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="gender"
                value="FEMALE"
                checked={gender === "FEMALE"}
                onChange={(e) => setGender(e.target.value as "FEMALE")}
                className="h-4 w-4 text-[color:var(--brand)] focus:ring-[color:var(--brand)]"
              />
              <span className="text-sm">Female</span>
            </label>
          </div>
          {errors.gender && (
            <p className="text-sm text-red-600">{errors.gender}</p>
          )}
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
        {submitting ? "Completing..." : "Complete Profile"}
      </button>

      <p className="text-center text-xs text-gray-500">
        Your information is secure and will only be used for accommodation purposes
      </p>
    </form>
  );
}