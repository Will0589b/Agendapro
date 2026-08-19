type EmailFieldProps = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
};

function EmailField({
  value,
  onChange,
  id = "email",
}: EmailFieldProps) {
  return (
    <div className="input-group">
      <label htmlFor={id}>E-mail</label>

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
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
          </svg>
        </span>

        <input
          id={id}
          type="email"
          placeholder="seuemail@exemplo.com"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="email"
        />
      </div>
    </div>
  );
}

export default EmailField;