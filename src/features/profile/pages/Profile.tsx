// FILE: src/features/profile/pages/Profile.tsx
import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FormField } from "../../../components/FormField";
import { FeedbackMessage } from "../../../components/FeedbackMessage";
import { Icon } from "../../../components/Icon";
import { BottomMenu } from "../../../components/BottomMenu";
import { ApiError, getMe, updateProfile } from "../../../lib/api";
import { validateEmail, validateLength } from "../../../lib/validators";
import type { AuthenticatedUser } from "../../../lib/types";

export function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [editing, setEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login/seeker", { replace: true });
      return;
    }

    getMe()
      .then((userData) => {
        setUser(userData);
        setFullName(userData.full_name || "");
        setPhone(userData.phone || "");
        setEmail(userData.email || "");
        setDateOfBirth(userData.date_of_birth || "");
        setLoading(false);
      })
      .catch(() => {
        localStorage.clear();
        navigate("/login/seeker", { replace: true });
      });
  }, [navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
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
    
    let emailError = null;
    if (user?.role === "OWNER") {
      emailError = validateEmail(trimmedEmail);
    }

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

    try {
      const updateData: any = {
        full_name: trimmedFullName,
        phone: trimmedPhone,
      };
      
      if (user?.role === "OWNER") {
        updateData.email = trimmedEmail;
      }
      
      if (user?.role === "SEEKER" && dateOfBirth) {
        updateData.date_of_birth = dateOfBirth;
      }

      console.log("Sending update data:", updateData);

      const updatedUser = await updateProfile(updateData);
      
      console.log("Update successful:", updatedUser);
      
      setUser(updatedUser);
      setFullName(updatedUser.full_name || "");
      setPhone(updatedUser.phone || "");
      setEmail(updatedUser.email || "");
      setDateOfBirth(updatedUser.date_of_birth || "");
      
      setSuccessMessage("Profile updated successfully!");
      setEditing(false);
      
    } catch (error: unknown) {
      console.error("Full error:", error);
      if (error instanceof ApiError) {
        console.error("API Error details:", error.status, error.data);
        setFormError(error.message || "Unable to update profile");
      } else {
        setFormError("Unable to update profile. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

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

  const isSeeker = user?.role === "SEEKER";
  const isOwner = user?.role === "OWNER";

  // FILE: src/features/profile/pages/Profile.tsx
// Update the return statement - add the logout button after the form and before BottomMenu

return (
  <>
    <div className="space-y-6 pb-20">
      <header className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <Icon name="chevron-left" />
        </button>
        <h1 className="text-lg font-semibold">Profile</h1>
        <button
          type="button"
          onClick={() => {
            setEditing(!editing);
            if (editing) {
              setFullName(user?.full_name || "");
              setPhone(user?.phone || "");
              setEmail(user?.email || "");
              setErrors({});
              setFormError(null);
              setSuccessMessage(null);
            }
          }}
          className="px-4 py-2 text-sm font-medium text-[color:var(--brand)] hover:bg-gray-100 rounded-lg"
        >
          {editing ? "Cancel" : "Edit"}
        </button>
      </header>

      {successMessage && (
        <FeedbackMessage variant="success" message={successMessage} />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl bg-gradient-to-br from-[color:var(--brand)]/10 to-purple-50 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
              <Icon name={isOwner ? "building" : "graduation-cap"} className="w-6 h-6 text-[color:var(--brand)]" />
            </div>
            <div>
              <p className="font-semibold text-[color:var(--ink)]">
                {isOwner ? "Dormitory Owner" : "Student Seeker"}
              </p>
              <p className="text-sm text-gray-600">{user?.email}</p>
              {isSeeker && user?.is_student_verified && (
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <span>✓</span>
                  <span>Verified Student</span>
                </p>
              )}
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
            disabled={!editing}
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
            disabled={!editing}
          />

          {isOwner && (
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
              disabled={!editing}
            />
          )}

          {isSeeker && (
            <>
              <FormField
                label="Email (University)"
                name="email"
                type="email"
                value={email}
                iconLeft={<Icon name="mail" />}
                disabled={true}
                autoComplete="email"
              />
              <p className="text-xs text-gray-500 -mt-2">
                Your university email cannot be changed
              </p>
            </>
          )}

          {isSeeker && dateOfBirth && (
            <FormField
              label="Date of Birth"
              name="dateOfBirth"
              type="date"
              value={dateOfBirth}
              iconLeft={<Icon name="calendar" />}
              disabled={!editing}
              autoComplete="bday"
            />
          )}
        </div>

        {formError && <FeedbackMessage variant="error" message={formError} />}

        {editing && (
          <button
            type="submit"
            className="w-full h-12 rounded-full font-semibold transition focus:outline-none focus:ring-2 focus:ring-[color:var(--brand)] focus:ring-offset-2 bg-[color:var(--brand)] text-white disabled:bg-gray-200 disabled:text-gray-400"
            disabled={submitting}
            aria-busy={submitting}
          >
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        )}
      </form>

      {/* Logout Button */}
      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = "/";
          }}
          className="w-full h-12 rounded-full font-semibold transition focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center gap-2"
        >
          <span>Logout</span>
        </button>
      </div>
    </div>
    
    <BottomMenu />
  </>
);
}