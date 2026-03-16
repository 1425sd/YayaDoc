import { z } from "zod/v4";
import { useForm } from "@mantine/form";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { useState } from "react";
import useAuth from "@/features/auth/hooks/use-auth";
import { useRedirectIfAuthenticated } from "@/features/auth/hooks/use-redirect-if-authenticated.ts";
import SsoLogin from "@/ee/components/sso-login.tsx";
import { useWorkspacePublicDataQuery } from "@/features/workspace/queries/workspace-query.ts";
import { Error404 } from "@/components/ui/error-404.tsx";
import { getAppName, isCloud } from "@/lib/config.ts";
import APP_ROUTE from "@/lib/app-route.ts";
import { AnimatedCharactersLoginPage } from "@/components/ui/animated-characters-login-page.tsx";

const formSchema = z.object({
  email: z.email().min(1, { message: "Email is required" }),
  password: z.string().min(1, { message: "Password is required" }),
});

type FormValues = z.infer<typeof formSchema>;

export function LoginForm() {
  const { signIn, isLoading } = useAuth();
  const [authError, setAuthError] = useState("");
  useRedirectIfAuthenticated();

  const {
    data,
    isLoading: isDataLoading,
    isError,
    error,
  } = useWorkspacePublicDataQuery();

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

  if (isDataLoading) {
    return null;
  }

  if (isError && error?.["response"]?.status === 404) {
    return <Error404 />;
  }

  return (
    <AnimatedCharactersLoginPage
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
      password={form.values.password}
      passwordError={form.errors.password}
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
