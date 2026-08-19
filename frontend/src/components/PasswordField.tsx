import { useState } from "react";

type PasswordFieldProps = {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  id?: string;
};

function PasswordField({
  label = "Senha",
  placeholder = "Digite sua senha",
  value,
  onChange,
  id = "password",
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="input-group">
      <label htmlFor={id}>{label}</label>

      <div className="input-wrapper">
        <span className="input-icon">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="4" y="10" width="16" height="10" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
        </span>

        <input
          id={id}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="password-input"
        />

        <button
          type="button"
          className="password-toggle"
          onClick={() => setShowPassword((prev) => !prev)}
          aria-label={
            showPassword ? "Ocultar senha" : "Mostrar senha"
          }
        >
          {showPassword ? (
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m3 3 18 18" />
              <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
              <path d="M6.6 6.6A11 11 0 0 0 2 12c1 4 5 8 10 8" />
            </svg>
          ) : (
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

export default PasswordField;