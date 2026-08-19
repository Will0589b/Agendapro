import { useState } from "react";
import BrandLogo from "../components/BrandLogo";
import EmailField from "../components/EmailField";
import PasswordField from "../components/PasswordField";
import AuthMessage from "../components/AuthMessage";
import { supabase } from "../lib/supabase";

type LoginProps = {
  onRegister: () => void;
  onForgotPassword: () => void;
};

function Login({
  onRegister,
  onForgotPassword,
}: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  setError("");

  if (!email || !password) {
    setError("Preencha o e-mail e a senha.");
    return;
  }

  setLoading(true);

  try {
    const { error: signInError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (signInError) {
      if (
        signInError.message
          .toLowerCase()
          .includes("invalid login credentials")
      ) {
        setError("E-mail ou senha inválidos.");
        return;
      }

      if (
        signInError.message
          .toLowerCase()
          .includes("email not confirmed")
      ) {
        setError("Confirme seu e-mail antes de entrar.");
        return;
      }

      setError("Não foi possível realizar o login.");
      return;
    }

    // Redirecionamento para o dashboard entra depois.
  } catch {
    setError(
      "Não foi possível conectar ao servidor. Tente novamente."
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <>
      <BrandLogo />

      <div className="login-heading">
        <h2>Bem-vindo de volta</h2>
        <p>Entre na sua conta para continuar.</p>
      </div>

      <AuthMessage type="error" message={error} />

      <form onSubmit={handleSubmit}>
        <EmailField
          value={email}
          onChange={setEmail}
        />

        <PasswordField
          value={password}
          onChange={setPassword}
        />

        <div className="login-options login-options-single">
  <button
    type="button"
    className="text-link"
    onClick={onForgotPassword}
  >
    Esqueci minha senha
  </button>
</div>
        <button
          className="login-button"
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Entrando...
            </>
          ) : (
            "Entrar"
          )}
        </button>
      </form>

      <div className="signup">
        <span>Ainda não tem uma conta?</span>

        <button
          type="button"
          className="text-link"
          onClick={onRegister}
        >
          Criar conta
        </button>
      </div>
    </>
  );
}

export default Login;