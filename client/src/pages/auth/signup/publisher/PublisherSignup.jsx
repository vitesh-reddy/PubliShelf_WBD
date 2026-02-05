//client/src/pages/auth/signup/publisher/PublisherSignup.jsx
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { signupPublisher } from "../../../../services/publisher.services.js";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle} from "../../../../components/ui/AlertDialog";
import { AuthHeader, TextInput, PasswordField, PasswordStrengthMeter, TermsCheckbox, NameFields, ConfirmPasswordField } from '../../components';

const PublisherSignup = () => {
  const { register, handleSubmit, watch, formState: { errors }, trigger } = useForm({ mode: 'onBlur' });
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const navigate = useNavigate();

  const passwordValue = watch('password') || '';

  const onSubmit = async (data) => {
    setServerError('');
    const { firstname, lastname, publishingHouse, businessEmail, password } = data;
    setIsLoading(true);
    try {
      const response = await signupPublisher({
        firstname: firstname.trim(),
        lastname: lastname.trim(),
        publishingHouse: publishingHouse.trim(),
        email: businessEmail.trim().toLowerCase(),
        password,
      });
      if (response.success) {
        setShowSuccessDialog(true);
      } else {
        setServerError(response.message || 'An unexpected error occurred.');
      }
    } catch (e) {
      console.error('Error during signup:', e);
      setServerError('An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-purple-50 to-white">
      <div className="max-w-md w-full">
        <AuthHeader
          title="Create Publisher Account"
          subtitle={<span>Already have an account? <Link to="/auth/login" className="text-purple-600 hover:text-purple-500 font-medium">Sign in</Link></span>}
        />

        <form id="signupForm" onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-white p-8 shadow-lg rounded-xl space-y-6 animate-fade-in">
            <NameFields
              register={register}
              trigger={trigger}
              errors={errors}
              firstNameRules={{
                required: 'First name is required.',
                validate: {
                  notEmpty: v => v.trim() !== '' || 'First name cannot be empty.',
                  alphabetsOnly: v => /^[A-Za-z\s]+$/.test(v) || 'Only alphabets and spaces allowed.',
                }
              }}
              lastNameRules={{
                required: 'Last name is required.',
                validate: {
                  notEmpty: v => v.trim() !== '' || 'Last name cannot be empty.',
                  alphabetsOnly: v => /^[A-Za-z\s]+$/.test(v) || 'Only alphabets and spaces allowed.',
                }
              }}
            />

            <TextInput
              label="Publishing House Name"
              name="publishingHouse"
              register={register}
              rules={{
                required: 'Publishing house name is required.',
                validate: {
                  notEmpty: v => v.trim() !== '' || 'Publishing house cannot be empty.',
                  alphabetsOnly: v => /^[A-Za-z0-9\s]+$/.test(v) || 'Only alphabets and numbers allowed.',
                }
              }}
              error={errors.publishingHouse}
              onBlurTrigger={trigger}
            />

            <TextInput
              label="Business Email"
              name="businessEmail"
              type="email"
              placeholder="publisher@publishelf.com"
              iconClass="fas fa-envelope"
              register={register}
              rules={{
                required: 'Business email is required.',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Please enter a valid email address.' },
                validate: { noUpper: v => v === v.toLowerCase() || 'Uppercase letters are not allowed.' }
              }}
              error={errors.businessEmail}
              onBlurTrigger={trigger}
            />

            <PasswordField
              label="Password"
              name="password"
              register={register}
              rules={{ required: 'Password is required.', minLength: { value: 3, message: 'Password must be at least 3 characters long.' } }}
              error={errors.password}
              onBlurTrigger={() => { trigger('password'); trigger('confirmPassword'); }}
            />

            <PasswordStrengthMeter password={passwordValue} />

            <ConfirmPasswordField
              register={register}
              trigger={trigger}
              errors={errors}
              passwordValue={passwordValue}
            />

            <TermsCheckbox
              name="termsAccepted"
              register={register}
              rules={{ required: 'You must agree to the Terms and Privacy Policy.' }}
              error={errors.termsAccepted}
              onBlurTrigger={trigger}
            />

            {serverError && (
              <p className="text-red-500 text-sm">{serverError}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center py-3 px-4 rounded-lg shadow-sm text-sm font-medium text-white 
                ${isLoading ? 'bg-purple-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'}
                focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all`}
            >
              {isLoading ? 'Creating Account...' : 'Create Publisher Account'}
            </button>
          </div>
        </form>
      </div>

      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Signup Received</AlertDialogTitle>
            <AlertDialogDescription>
              Your publisher account has been submitted for verification.
              You’ll be able to log in once a manager approves your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => navigate('/auth/login')}>
              Go to Login
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate('/auth/login')}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PublisherSignup;
