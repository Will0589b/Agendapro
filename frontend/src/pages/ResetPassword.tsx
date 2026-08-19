import { useState } from "react";
import BrandLogo from "../components/BrandLogo";
import PasswordField from "../components/PasswordField";
import AuthMessage from "../components/AuthMessage";
import { supabase } from "../lib/supabase";

type ResetPasswordProps = {
  onBackToLogin: () => void;
};

function ResetPassword({
  onBackToLogin,
}: ResetPasswordProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!password || !confirmPassword) {
      setError("Preencha os dois campos.");
      return;
    }

    if (password.length < 6) {
      setError(
        "A senha deve possuir pelo menos 6 caracteres."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } =
        await supabase.auth.updateUser({
          password,
        });

      if (updateError) {
  console.error(
    "ERRO AO ALTERAR SENHA:",
    updateError
  );

  setError(updateError.message);
  return;
}

      setSuccess(
        "Senha alterada com sucesso! Você já pode entrar com sua nova senha."
      );

      setPassword("");
      setConfirmPassword("");
    } catch {
      setError(
        "Não foi possível conectar ao servidor."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <BrandLogo />

      <div className="login-heading">
        <h2>Definir nova senha</h2>

        <p>
          Escolha uma nova senha para sua conta.
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

      <form onSubmit={handleSubmit}>
        <PasswordField
          id="new-password"
          label="Nova senha"
          placeholder="Digite sua nova senha"
          value={password}
          onChange={setPassword}
        />

        <PasswordField
          id="confirm-new-password"
          label="Confirmar nova senha"
          placeholder="Digite novamente"
          value={confirmPassword}
          onChange={setConfirmPassword}
        />

        <button
          className="login-button"
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Alterando senha...
            </>
          ) : (
            "Alterar senha"
          )}
        </button>
      </form>

      {success && (
        <div className="signup">
          <button
            type="button"
            className="text-link"
            onClick={onBackToLogin}
          >
            Voltar para o login
          </button>
        </div>
      )}
    </>
  );
}

export default ResetPassword;