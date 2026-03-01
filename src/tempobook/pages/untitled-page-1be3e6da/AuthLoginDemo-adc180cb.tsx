import { AuthProvider } from "@/context/AuthContext";
import LoginPage from "@/components/auth/LoginPage";

export default function AuthLoginDemo() {
  return (
    <AuthProvider>
      <LoginPage />
    </AuthProvider>
  );
}
