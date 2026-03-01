import { AuthProvider } from "@/context/AuthContext";
import SignupPage from "@/components/auth/SignupPage";

export default function AuthSignupDemo() {
  return (
    <AuthProvider>
      <SignupPage />
    </AuthProvider>
  );
}
