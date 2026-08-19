type AuthMessageProps = {
  type: "error" | "success";
  message: string;
};

function AuthMessage({
  type,
  message,
}: AuthMessageProps) {
  if (!message) return null;

  return (
    <div
      className={
        type === "error"
          ? "error-message"
          : "success-message"
      }
    >
      {message}
    </div>
  );
}

export default AuthMessage;