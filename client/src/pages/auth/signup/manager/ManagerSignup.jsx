//client/src/pages/auth/signup/manager/ManagerSignup.jsx
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { signupManager } from "../../../../services/manager.services.js";
import { AuthHeader, NameFields, TextInput, PasswordField, PasswordStrengthMeter, ConfirmPasswordField, TermsCheckbox } from '../../components';

const ManagerSignup = () => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
  } = useForm({ mode: "onBlur" });

  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const passwordValue = watch("password", "");

  const onSubmit = async (data) => {
    setServerError("");

    const firstname = data.firstname.trim();
    const lastname = data.lastname.trim();
    const email = data.email.trim().toLowerCase();
    const password = data.password;

    setIsLoading(true);

    try {
      const response = await signupManager({ firstname, lastname, email, password });

      if (response.success) {
        navigate("/auth/login");
      } else {
        setServerError(response.message || "An unexpected error occurred.");
      }
    } catch (error) {
      console.error("Error during signup:", error);
      setServerError("An error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-purple-50 to-white bg-gray-50">
      <div className="max-w-md w-full">

        <AuthHeader
          title="Create Manager Account"
          subtitle={<span>Already have an account? <Link to="/auth/login" className="font-medium text-purple-600 hover:text-purple-500">Sign in</Link></span>}
        />

        {/* Form */}
        <form id="signupForm" onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          <div className="bg-white p-8 shadow-lg rounded-xl space-y-6 animate-fade-in">

            <NameFields
              register={register}
              trigger={trigger}
              errors={errors}
              firstNameRules={{
                required: 'First name is required.',
                validate: {
                  noEmpty: v => v.trim() !== '' || 'First name cannot be empty.',
                  alphabetsOnly: v => /^[A-Za-z\s]+$/.test(v) || 'Only alphabets and spaces allowed.',
                }
              }}
              lastNameRules={{
                required: 'Last name is required.',
                validate: {
                  noEmpty: v => v.trim() !== '' || 'Last name cannot be empty.',
                  alphabetsOnly: v => /^[A-Za-z\s]+$/.test(v) || 'Only alphabets and spaces allowed.',
                }
              }}
            />

            {/* Email */}
            <TextInput
              label="Email"
              name="email"
              type="email"
              placeholder="manager@publishelf.com"
              iconClass="fas fa-envelope"
              register={register}
              rules={{
                required: 'Email is required.',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Please enter a valid email address.' },
                validate: { noUpper: v => v === v.toLowerCase() || 'Uppercase letters are not allowed.' }
              }}
              error={errors.email}
              onBlurTrigger={trigger}
            />

            {/* Password */}
            <PasswordField
              label="Password"
              name="password"
              register={register}
              rules={{ required: 'Password is required.', minLength: { value: 3, message: 'Password must be at least 3 characters long.' } }}
              error={errors.password}
              onBlurTrigger={() => { trigger('password'); trigger('confirmPassword'); }}
            />
            <PasswordStrengthMeter password={passwordValue} />

            {/* Confirm Password */}
            <ConfirmPasswordField
              register={register}
              trigger={trigger}
              errors={errors}
              passwordValue={passwordValue}
            />

            {/* Terms */}
            <TermsCheckbox
              name="termsAccepted"
              register={register}
              rules={{ required: 'You must agree to the Terms and Privacy Policy.' }}
              error={errors.termsAccepted}
              onBlurTrigger={trigger}
            />

            {/* Global Server Error */}
            {serverError && (
              <p className="text-red-500 text-sm">{serverError}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center py-3 px-4 rounded-lg shadow-sm text-sm font-medium text-white
                ${isLoading ? "bg-purple-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700"}
                focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-300`}
            >
              {isLoading ? "Creating Account..." : "Create Manager Account"}
            </button>

          </div>
        </form>
      </div>
    </div>
  );
};

export default ManagerSignup;
