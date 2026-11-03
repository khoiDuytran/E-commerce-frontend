import LoginForm from "@/components/store/login.form";
import { Suspense } from "react";

const LoginPage = () => {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
};

export default LoginPage;
