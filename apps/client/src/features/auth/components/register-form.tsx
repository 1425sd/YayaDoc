import { z } from "zod/v4";
import { useEffect, useState } from "react";
import { useForm } from "@mantine/form";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { notifications } from "@mantine/notifications";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useAuth from "@/features/auth/hooks/use-auth";
import { useRedirectIfAuthenticated } from "@/features/auth/hooks/use-redirect-if-authenticated.ts";
import { useWorkspacePublicDataQuery } from "@/features/workspace/queries/workspace-query.ts";
import { AnimatedCharactersAuthPage } from "@/components/ui/animated-characters-login-page.tsx";
import { Error404 } from "@/components/ui/error-404.tsx";
import { getAppName } from "@/lib/config.ts";
import APP_ROUTE from "@/lib/app-route.ts";
import SsoLogin from "@/ee/components/sso-login.tsx";

type FormValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export function RegisterForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { publicSignup, isLoading } = useAuth();
  const [authError, setAuthError] = useState("");
  useRedirectIfAuthenticated();

  const {
    data,
    isLoading: isDataLoading,
    isError,
    error,
  } = useWorkspacePublicDataQuery();

  const formSchema = z
    .object({
      name: z
        .string()
        .trim()
        .max(50, {
          message: t("Display name must be 50 characters or fewer"),
        })
        .optional(),
      email: z
        .email({ message: t("Invalid email address") })
        .min(1, { message: t("Email is required") }),
      password: z.string().min(8, {
        message: t("Password must be at least 8 characters"),
      }),
      confirmPassword: z.string().min(1, {
        message: t("Please confirm your password"),
      }),
    })
    .refine((values) => values.password === values.confirmPassword, {
      message: t("Passwords do not match"),
      path: ["confirmPassword"],
    });

  const form = useForm<FormValues>({
    validate: zod4Resolver(formSchema),
    initialValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (isDataLoading || !data || data.enablePublicSignup) {
      return;
    }

    notifications.show({
      message: t("Public signup is currently disabled."),
      color: "red",
    });
    navigate(APP_ROUTE.AUTH.LOGIN, { replace: true });
  }, [data, isDataLoading, navigate, t]);

  const handleSubmit = form.onSubmit(async (values) => {
    setAuthError("");

    const result = await publicSignup({
      name: values.name.trim() || undefined,
      email: values.email,
      password: values.password,
    });

    if (!result?.ok && result?.error) {
      setAuthError(result.error);
    }
  });

  if (isDataLoading) {
    return null;
  }

  if (isError && error?.["response"]?.status === 404) {
    return <Error404 />;
  }

  if (!data?.enablePublicSignup) {
    return null;
  }

  return (
    <AnimatedCharactersAuthPage
      authError={authError}
      bottomHref={APP_ROUTE.AUTH.LOGIN}
      bottomLabel={t("Sign In")}
      bottomText={t("Already have an account?")}
      brandName={data?.name ?? getAppName()}
      confirmPassword={form.values.confirmPassword}
      confirmPasswordError={form.errors.confirmPassword}
      email={form.values.email}
      emailError={form.errors.email}
      enforceSso={data?.enforceSso}
      isLoading={isLoading}
      mode="register"
      name={form.values.name}
      nameError={form.errors.name}
      password={form.values.password}
      passwordError={form.errors.password}
      socialLogin={data?.authProviders?.length ? <SsoLogin /> : undefined}
      onConfirmPasswordBlur={() => {
        form.validateField("confirmPassword");
      }}
      onConfirmPasswordChange={(value) => {
        setAuthError("");
        form.setFieldValue("confirmPassword", value);
      }}
      onEmailBlur={() => {
        form.validateField("email");
      }}
      onEmailChange={(value) => {
        setAuthError("");
        form.setFieldValue("email", value);
      }}
      onNameBlur={() => {
        form.validateField("name");
      }}
      onNameChange={(value) => {
        setAuthError("");
        form.setFieldValue("name", value);
      }}
      onPasswordBlur={() => {
        form.validateField("password");
        form.validateField("confirmPassword");
      }}
      onPasswordChange={(value) => {
        setAuthError("");
        form.setFieldValue("password", value);
      }}
      onSubmit={handleSubmit}
    />
  );
}
