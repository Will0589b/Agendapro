import { useState } from "react";
import BrandLogo from "../components/BrandLogo";
import EmailField from "../components/EmailField";
import AuthMessage from "../components/AuthMessage";
import { supabase } from "../lib/supabase";

type ForgotPasswordProps = {
  onBackToLogin: () => void;
};

function ForgotPassword({
  onBackToLogin,
}: ForgotPasswordProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!email) {
      setError("Digite seu e-mail.");
      return;
    }

    setLoading(true);

    try {
      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(email, {
          redirectTo:
            "http://localhost:5173/?reset-password=true",
        });

      if (resetError) {
  if (resetError.message.includes("rate limit")) {
    setError(
      "Muitas solicitações foram feitas. Aguarde um pouco e tente novamente."
    );
    return;
  }

  setError(
    "Não foi possível enviar o e-mail de recuperação."
  );

  return;
}

      setSuccess(
        "Se esse e-mail estiver cadastrado, enviaremos um link para redefinir sua senha."
      );
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
        <h2>Recuperar senha</h2>

        <p>
          Digite seu e-mail para receber as instruções de recuperação.
        </p>
      </div>

      <AuthMessage
        type="error"
        message={error}
      />

      <AuthMessage
        type="success"
        message={success}
      />

      <form onSubmit={handleSubmit} noValidate>
        <EmailField
          id="forgot-email"
          value={email}
          onChange={setEmail}
        />

        <button
          className="login-button"
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Enviando...
            </>
          ) : (
            "Enviar instruções"
          )}
        </button>
      </form>

      <div className="signup">
        <button
          type="button"
          className="text-link"
          onClick={onBackToLogin}
        >
          ← Voltar para o login
        </button>
      </div>
    </>
  );
}

export default ForgotPassword;