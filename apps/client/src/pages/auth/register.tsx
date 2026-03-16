import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { RegisterForm } from "@/features/auth/components/register-form.tsx";
import { getAppName } from "@/lib/config.ts";

export default function RegisterPage() {
  const { t } = useTranslation();

  return (
    <>
      <Helmet>
        <title>
          {t("Sign Up")} - {getAppName()}
        </title>
      </Helmet>
      <RegisterForm />
    </>
  );
}
