import { useForm } from 'react-hook-form';
import React, { useContext, useState, useEffect } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import { useNavigate, useOutletContext, useLocation } from 'react-router-dom';
import { useRegisterUserMutation } from '~/data-provider';
import type { TError } from 'librechat-data-provider';
import { useLocalize, TranslationKeys, ThemeContext } from '~/hooks';
import type { TLoginLayoutContext } from '~/common';
import { Spinner, Button } from '~/components';
import { ErrorMessage } from './ErrorMessage';
import SocialLoginRender from './SocialLoginRender';

// Local type definition for registration with separate first_name and last_name
type TRegisterUserLocal = {
  email: string;
  password: string;
  confirm_password?: string;
  token?: string;
};

const Registration: React.FC = () => {
  const navigate = useNavigate();
  const localize = useLocalize();
  const { theme } = useContext(ThemeContext);
  const { startupConfig, startupConfigError, isFetching } = useOutletContext<TLoginLayoutContext>();

  const {
    watch,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TRegisterUserLocal>({ mode: 'onChange' });
  const password = watch('password');

  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState<number>(3);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [shouldNavigate, setShouldNavigate] = useState(false);

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');
  const validTheme = theme === 'dark' ? 'dark' : 'light';

  // only require captcha if we have a siteKey
  const requireCaptcha = Boolean(startupConfig?.turnstile?.siteKey);

  // Handle navigation after successful registration
  useEffect(() => {
    if (shouldNavigate && countdown === 0) {
      navigate('/c/new', { replace: true });
    }
  }, [shouldNavigate, countdown, navigate]);

  const registerUser = useRegisterUserMutation({
    onMutate: () => {
      setIsSubmitting(true);
    },
    onSuccess: () => {
      setIsSubmitting(false);
      setCountdown(3);
      setShouldNavigate(true);
      const timer = setInterval(() => {
        setCountdown((prevCountdown) => {
          if (prevCountdown <= 1) {
            clearInterval(timer);
            return 0;
          } else {
            return prevCountdown - 1;
          }
        });
      }, 1000);
    },
    onError: (error: unknown) => {
      setIsSubmitting(false);
      console.error("📝 Registration Error Handler:", error);
      
      const axiosError = error as any;
      console.error("📝 Registration Error Response:", axiosError.response?.data);
      console.error("📝 Registration Error Status:", axiosError.response?.status);
      
      if (axiosError.response?.status === 409) {
        // Handle conflict error (username/email already exists)
        const errorData = axiosError.response?.data;
        if (errorData?.message) {
          setErrorMessage(errorData.message);
        } else if (errorData?.error) {
          setErrorMessage(errorData.error);
        } else {
          setErrorMessage('Acest nume de utilizator sau adresa de email este deja înregistrat(ă). Vă rugăm să alegeți alte date sau să vă conectați dacă aveți deja un cont.');
        }
      } else if (axiosError.response?.data?.message) {
        setErrorMessage(axiosError.response.data.message);
      } else if (axiosError.message) {
        setErrorMessage(axiosError.message);
      } else {
        setErrorMessage('Registration failed. Please try again.');
      }
    },
  });

  const renderInput = (id: string, label: TranslationKeys, type: string, validation: object) => (
    <div className="mb-4">
      <div className="relative">
        <input
          id={id}
          type={type}
          autoComplete={id}
          aria-label={localize(label)}
          {...register(
            id as 'email' | 'username' | 'password' | 'confirm_password',
            validation,
          )}
          aria-invalid={!!errors[id]}
          className="webkit-dark-styles transition-color peer w-full rounded-[16px] border border-gray-300 bg-white px-3.5 pb-2.5 pt-3 text-black duration-200 focus:border-gray-500 focus:outline-none dark:border-gray-600 dark:bg-[#283543] dark:text-black dark:focus:border-gray-400"
          placeholder=" "
          data-testid={id}
        />
        <label
          htmlFor={id}
          className="absolute start-3 top-1.5 z-10 origin-[0] -translate-y-4 scale-75 transform rounded-[12px] bg-white px-2 text-sm text-text-secondary-alt duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-1.5 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:px-2 peer-focus:text-[#000000] dark:peer-focus:text-white dark:bg-[#182533] rtl:peer-focus:left-auto rtl:peer-focus:translate-x-1/4"
        >
          {localize(label)}
        </label>
      </div>
      {errors[id] && (
        <span role="alert" className="mt-1 text-sm text-red-500">
          {String(errors[id]?.message) ?? ''}
        </span>
      )}
    </div>
  );

  return (
    <>
      {errorMessage && (
        <ErrorMessage>
          {localize('com_auth_error_create')} {errorMessage}
        </ErrorMessage>
      )}
      {registerUser.isSuccess && countdown > 0 && (
        <div
          className="rounded-[16px] border border-green-500 bg-white px-3 py-2 text-sm text-gray-600 dark:text-gray-200"
          role="alert"
        >
          {localize(
            startupConfig?.emailEnabled
              ? 'com_auth_registration_success_generic'
              : 'com_auth_registration_success_insecure',
          ) +
            ' ' +
            localize('com_auth_email_verification_redirecting', { 0: countdown.toString() })}
        </div>
      )}
      {!startupConfigError && !isFetching && (
        <>
          <form
            className="mt-6"
            aria-label="Registration form"
            method="POST"
            onSubmit={handleSubmit((data: TRegisterUserLocal) => {
              console.log("📝 Registration Form Submit - Raw form data:", data);
              console.log("📝 Registration Form Submit - Form errors:", errors);
              console.log("📝 Registration Form Submit - Turnstile token:", turnstileToken);
              
              // Transform local data to the format expected by the API
              const apiData = {
                email: data.email,
                password: data.password,
                token: token ?? undefined,
              };
              
              console.log("📝 Registration Form Submit - API data being sent:", apiData);
              console.log("📝 Registration Form Submit - Password length:", data.password?.length);
              console.log("📝 Registration Form Submit - Password confirmation match:", data.password === data.confirm_password);
              
              registerUser.mutate(apiData);
            })}
          >
                                                {renderInput('email', 'com_auth_email', 'email', {
              required: localize('com_auth_email_required'),
              minLength: {
                value: 1,
                message: localize('com_auth_email_min_length'),
              },
              maxLength: {
                value: 120,
                message: localize('com_auth_email_max_length'),
              },
              pattern: {
                value: /\S+@\S+\.\S+/,
                message: localize('com_auth_email_pattern'),
              },
            })}
            {renderInput('password', 'com_auth_password', 'password', {
              required: localize('com_auth_password_required'),
              minLength: {
                value: 8,
                message: localize('com_auth_password_min_length'),
              },
              maxLength: {
                value: 128,
                message: localize('com_auth_password_max_length'),
              },
              pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
              },
            })}
            {renderInput('confirm_password', 'com_auth_password_confirm', 'password', {
              validate: (value: string) =>
                value === password || localize('com_auth_password_not_match'),
            })}

            {startupConfig?.turnstile?.siteKey && (
              <div className="my-4 flex justify-center">
                <Turnstile
                  siteKey={startupConfig.turnstile.siteKey}
                  options={{
                    ...startupConfig.turnstile.options,
                    theme: validTheme,
                  }}
                  onSuccess={(token) => setTurnstileToken(token)}
                  onError={() => setTurnstileToken(null)}
                  onExpire={() => setTurnstileToken(null)}
                />
              </div>
            )}

            <div className="mt-6">
              <Button
                disabled={
                  Object.keys(errors).length > 0 ||
                  isSubmitting ||
                  (requireCaptcha && !turnstileToken)
                }
                type="submit"
                aria-label="Submit registration"
                variant="submit"
                className="h-12 w-full rounded-[20px]"
              >
                {isSubmitting ? <Spinner /> : localize('com_auth_continue')}
              </Button>
            </div>
          </form>

          <SocialLoginRender startupConfig={startupConfig} />

          <p className="my-4 text-center text-sm font-light text-gray-700 dark:text-white">
            {localize('com_auth_already_have_account')}{' '}
            <a
              href="/login"
              aria-label="Login"
              className="inline-flex p-1 text-sm font-medium text-[#000000] transition-colors hover:text-[#000000] dark:text-white dark:hover:text-gray-300"
            >
              {localize('com_auth_login')}
            </a>
          </p>
        </>
      )}
    </>
  );
};

export default Registration;
