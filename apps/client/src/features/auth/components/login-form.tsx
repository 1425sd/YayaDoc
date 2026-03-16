import { z } from "zod/v4";
import { useForm } from "@mantine/form";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { useEffect, useState } from "react";
import useAuth from "@/features/auth/hooks/use-auth";
import { useRedirectIfAuthenticated } from "@/features/auth/hooks/use-redirect-if-authenticated.ts";
import SsoLogin from "@/ee/components/sso-login.tsx";
import { useWorkspacePublicDataQuery } from "@/features/workspace/queries/workspace-query.ts";
import { Error404 } from "@/components/ui/error-404.tsx";
import { getAppName, isCloud } from "@/lib/config.ts";
import APP_ROUTE from "@/lib/app-route.ts";
import { AnimatedCharactersAuthPage } from "@/components/ui/animated-characters-login-page.tsx";
import { notifications } from "@mantine/notifications";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

type FormValues = {
  email: string;
  password: string;
};

export function LoginForm() {
  const { t } = useTranslation();
  const { signIn, isLoading } = useAuth();
  const [authError, setAuthError] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  useRedirectIfAuthenticated();

  const {
    data,
    isLoading: isDataLoading,
    isError,
    error,
  } = useWorkspacePublicDataQuery();

  const formSchema = z.object({
    email: z
      .email({ message: t("Invalid email address") })
      .min(1, { message: t("Email is required") }),
    password: z.string().min(1, { message: t("Password is required") }),
  });

  const form = useForm<FormValues>({
    validate: zod4Resolver(formSchema),
    initialValues: {
      email: "",
      password: "",
    },
  });

  const handleSubmit = form.onSubmit(async (values) => {
    setAuthError("");
    const result = await signIn(values);

    if (!result?.ok && result?.error) {
      setAuthError(result.error);
    }
  });

  useEffect(() => {
    if (searchParams.get("registered") !== "1") {
      return;
    }

    notifications.show({
      message: t("Registration successful. Please log in."),
      color: "green",
    });

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete("registered");
    setSearchParams(nextSearchParams, { replace: true });
  }, [searchParams, setSearchParams, t]);

  if (isDataLoading) {
    return null;
  }

  if (isError && error?.["response"]?.status === 404) {
    return <Error404 />;
  }

  const showPublicSignup = data?.enablePublicSignup && !data?.enforceSso;

  return (
    <AnimatedCharactersAuthPage
      authError={authError}
      brandName={data?.name ?? getAppName()}
      bottomHref={isCloud() ? APP_ROUTE.AUTH.CREATE_WORKSPACE : undefined}
      bottomLabel={isCloud() ? "Create one" : undefined}
      bottomText={isCloud() ? "Don't have a workspace?" : undefined}
      email={form.values.email}
      emailError={form.errors.email}
      enforceSso={data?.enforceSso}
      forgotPasswordHref={APP_ROUTE.AUTH.FORGOT_PASSWORD}
      isLoading={isLoading}
      mode="login"
      password={form.values.password}
      passwordError={form.errors.password}
      secondaryActionHref={showPublicSignup ? APP_ROUTE.AUTH.SIGNUP : undefined}
      secondaryActionLabel={showPublicSignup ? t("Sign Up") : undefined}
      socialLogin={data?.authProviders?.length ? <SsoLogin /> : undefined}
      onEmailBlur={() => {
        form.validateField("email");
      }}
      onEmailChange={(value) => {
        setAuthError("");
        form.setFieldValue("email", value);
      }}
      onPasswordBlur={() => {
        form.validateField("password");
      }}
      onPasswordChange={(value) => {
        setAuthError("");
        form.setFieldValue("password", value);
      }}
      onSubmit={handleSubmit}
    />
  );
}
