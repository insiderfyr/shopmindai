import { TranslationKeys, useLocalize } from '~/hooks';
import { TStartupConfig } from 'librechat-data-provider';
import { ErrorMessage } from '~/components/Auth/ErrorMessage';
import { BlinkAnimation } from './BlinkAnimation';
import { ThemeSelector } from '~/components';
import LogoIcon from '~/components/svg/LogoIcon';
import Footer from './Footer';

function AuthLayout({
  children,
  header,
  isFetching,
  startupConfig,
  startupConfigError,
  pathname,
  error,
}: {
  children: React.ReactNode;
  header: React.ReactNode;
  isFetching: boolean;
  startupConfig: TStartupConfig | null | undefined;
  startupConfigError: unknown | null | undefined;
  pathname: string;
  error: TranslationKeys | null;
}) {
  const localize = useLocalize();

  const hasStartupConfigError = startupConfigError !== null && startupConfigError !== undefined;
  const DisplayError = () => {
    if (hasStartupConfigError) {
      return (
        <div className="mx-auto sm:max-w-sm">
          <ErrorMessage>{localize('com_auth_error_login_server')}</ErrorMessage>
        </div>
      );
    } else if (error === 'com_auth_error_invalid_reset_token') {
      return (
        <div className="mx-auto sm:max-w-sm">
          <ErrorMessage>
            {localize('com_auth_error_invalid_reset_token')}{' '}
            <a className="font-semibold text-[#000000] hover:underline" href="/forgot-password">
              {localize('com_auth_click_here')}
            </a>{' '}
            {localize('com_auth_to_try_again')}
          </ErrorMessage>
        </div>
      );
    } else if (error != null && error) {
      return (
        <div className="mx-auto sm:max-w-sm">
          <ErrorMessage>{localize(error)}</ErrorMessage>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className="relative flex min-h-screen bg-[#F5FBFF] dark:bg-[#182533]"
      style={
        {
          '--page-bg': '#F5FBFF',
          '--page-bg-dark': '#182533',
        } as React.CSSProperties
      }
    >
      {/* Left side - Form */}
      <div className="relative flex w-full flex-col items-center justify-center md:w-1/2">
        <BlinkAnimation active={isFetching}>
          <div className="-ml-20 mt-4 flex h-14 items-center justify-center gap-3">
            <LogoIcon size={56} className="text-[#000000]" />
            <h1 className="text-2xl font-bold text-foreground">
              {localize('com_ui_shopmind')}
              <span className="text-[#4d8eff]">{localize('com_ui_ai')}</span>
            </h1>
          </div>
        </BlinkAnimation>
        <DisplayError />
        <div className="absolute bottom-0 left-0 md:m-4">
          <ThemeSelector />
        </div>

        <div className="flex flex-grow items-center justify-center">
          <div className="flex flex-col items-center gap-8">
            <div className="w-authPageWidth overflow-hidden px-6 py-4 sm:max-w-md sm:rounded-[20px]">
              {!hasStartupConfigError && !isFetching && (
                <h1
                  className="mb-4 text-center text-3xl font-semibold text-black dark:text-white"
                  style={{ userSelect: 'none' }}
                >
                  {header}
                </h1>
              )}
              {children}
            </div>
          </div>
        </div>
        <Footer startupConfig={startupConfig} />
      </div>

      {/* Right side - New section */}
      <div className="hidden bg-[#182533] dark:bg-[#F5FBFF] md:flex md:w-1/2">
        {/* Content for the right side can be added here */}
      </div>
    </div>
  );
}

export default AuthLayout;
