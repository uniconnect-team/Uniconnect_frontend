import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FormField } from "../../../components/FormField";
import { FeedbackMessage } from "../../../components/FeedbackMessage";
import { Icon } from "../../../components/Icon";
import type { IconName } from "../../../components/Icon";
import { ApiError, requestSeekerVerification } from "../../../lib/api";
import { validateEmail, validateLength, validatePassword } from "../../../lib/validators";

export function Signup() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [universityEmail, setUniversityEmail] = useState("");
  const [studentId, setStudentId] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isValid = useMemo(() => {
    const trimmedFullName = fullName.trim();
    const trimmedPhone = phone.trim();
    const trimmedUniversityEmail = universityEmail.trim();
    const fullNameValid = trimmedFullName.length >= 1 && trimmedFullName.length <= 80;
    const phoneValid = trimmedPhone.length >= 6 && trimmedPhone.length <= 18;
    const universityEmailValid =
      !validateEmail(trimmedUniversityEmail) && /(\.edu|\.ac)(\.[a-z]+)?$/i.test(trimmedUniversityEmail);
    const passwordValid = !validatePassword(password);
    const studentIdValid = studentId.trim().length >= 4 && studentId.trim().length <= 20;
    return fullNameValid && phoneValid && universityEmailValid && passwordValid && studentIdValid;
  }, [fullName, phone, password, universityEmail, studentId]);

  const heroIcons: IconName[] = [
    "users",
    "building",
    "messages-square",
    "briefcase",
    "calendar",
    "sparkles",
  ];

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedFullName = fullName.trim();
    const trimmedPhone = phone.trim();
    const trimmedUniversityEmail = universityEmail.trim();
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
    const passwordError = validatePassword(password ?? "");
    const universityEmailError = (() => {
      const baseError = validateEmail(trimmedUniversityEmail);
      if (baseError) return baseError;
      return /(\.edu|\.ac)(\.[a-z]+)?$/i.test(trimmedUniversityEmail)
        ? null
        : "Use your student email (e.g. name@school.edu)";
    })();
    const trimmedStudentId = studentId.trim();
    const studentIdError = validateLength(trimmedStudentId, {
      min: 4,
      max: 20,
      message: "Student ID must be 4-20 characters",
    });

    const nextErrors = {
      fullName: fullNameError,
      phone: phoneError,
      password: passwordError,
      universityEmail: universityEmailError,
      studentId: studentIdError,
    };

    setErrors(nextErrors);
    setFormError(null);

    if (fullNameError || phoneError || passwordError || universityEmailError || studentIdError) {
      return;
    }

    setSubmitting(true);

    requestSeekerVerification({
      email: trimmedUniversityEmail,
      student_id: trimmedStudentId,
    })
      .then(({ verification_token }) => {
        navigate("/signup/verify", {
          state: {
            fullName: trimmedFullName,
            phone: trimmedPhone,
            password,
            universityEmail: trimmedUniversityEmail,
            studentId: trimmedStudentId,
            verificationToken: verification_token,
          },
        });
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError) {
          setFormError(error.message || "Unable to send verification code");
        } else {
          setFormError("Unable to send verification code. Please try again.");
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
        <h1 className="text-lg font-semibold text-center flex-1">Dormitory Seeker Sign Up</h1>
        <span className="w-5" aria-hidden="true" />
      </header>

      <div
        className="relative w-full h-36 overflow-hidden rounded-2xl bg-gradient-to-br from-[color:var(--brand)] via-indigo-500 to-purple-500"
        aria-hidden="true"
      >
        <div className="grid h-full grid-cols-3 gap-4 p-5 text-white/80">
          {heroIcons.map((icon, index) => (
            <div
              key={`${icon}-${index}`}
              className="flex items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm"
            >
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
        <FormField //password visibility toggle added
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

      <div className="space-y-4 rounded-2xl bg-gray-50 p-4">
        <div className="space-y-1">
          <p className="font-medium text-[color:var(--ink)]">University Verification</p>
          <p className="text-sm text-gray-500">
            Use your official university credentials. We&apos;ll email you a verification code on the
            next step.
          </p>
        </div>
        <FormField
          label="University Email"
          name="universityEmail"
          type="email"
          placeholder="Enter your university email"
          value={universityEmail}
          onChange={(event) => setUniversityEmail(event.target.value)}
          iconLeft={<Icon name="graduation-cap" />}
          error={errors.universityEmail}
          autoComplete="email"
        />
        <FormField
          label="Student ID"
          name="studentId"
          placeholder="Enter your student ID"
          value={studentId}
          onChange={(event) => setStudentId(event.target.value)}
          iconLeft={<Icon name="id-card" />}
          error={errors.studentId}
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
          Already have an account?{' '}
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
