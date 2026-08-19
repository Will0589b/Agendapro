import { useState } from "react";
import BrandLogo from "../components/BrandLogo";
import EmailField from "../components/EmailField";
import PasswordField from "../components/PasswordField";
import AuthMessage from "../components/AuthMessage";
import { supabase } from "../lib/supabase";

type RegisterProps = {
  onBackToLogin: () => void;
};

function Register({ onBackToLogin }: RegisterProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!email || !password || !confirmPassword) {
      setError("Preencha todos os campos.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      setError("Digite um e-mail válido.");
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
      const { data, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password,
        });

      if (signUpError) {
        if (
          signUpError.message
            .toLowerCase()
            .includes("already registered")
        ) {
          setError(
            "Já existe uma conta cadastrada com este e-mail."
          );
          return;
        }

        if (
          signUpError.message
            .toLowerCase()
            .includes("rate limit")
        ) {
          setError(
            "Muitas tentativas foram realizadas. Aguarde um pouco e tente novamente."
          );
          return;
        }

        setError(
          "Não foi possível criar sua conta. Tente novamente."
        );
        return;
      }

      if (!data.user) {
        setError(
          "Não foi possível criar sua conta. Tente novamente."
        );
        return;
      }

      setSuccess(
        "Conta criada com sucesso! Verifique seu e-mail para confirmar o cadastro."
      );

      setEmail("");
      setPassword("");
      setConfirmPassword("");
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
        <h2>Crie sua conta</h2>

        <p>
          Comece a organizar sua rotina com o AgendaPro.
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

      <form
        onSubmit={handleSubmit}
        noValidate
      >
        <EmailField
          id="register-email"
          value={email}
          onChange={setEmail}
        />

        <PasswordField
          id="register-password"
          label="Senha"
          placeholder="Crie uma senha"
          value={password}
          onChange={setPassword}
        />

        <PasswordField
          id="confirm-password"
          label="Confirmar senha"
          placeholder="Digite a senha novamente"
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
              Criando conta...
            </>
          ) : (
            "Criar conta"
          )}
        </button>
      </form>

      <div className="signup">
        <span>Já possui uma conta?</span>

        <button
          type="button"
          className="text-link"
          onClick={onBackToLogin}
        >
          Voltar para o login
        </button>
      </div>
    </>
  );
}

export default Register;