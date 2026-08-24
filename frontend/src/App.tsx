import {
  useEffect,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";

import "./App.css";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import PublicBooking from "./pages/PublicBooking";
import BookingManagement from "./pages/BookingManagement";

import { supabase } from "./lib/supabase";

type ScreenMode =
  | "login"
  | "register"
  | "forgot"
  | "reset";

const getPublicBookingSlug = () => {
  const match = window.location.pathname.match(
    /^\/agendar\/([^/]+)\/?$/
  );

  if (!match) {
    return null;
  }

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
};

const getAppointmentManagementToken = () => {
  const pathParts = window.location.pathname
    .split("/")
    .filter(Boolean);

  if (
    pathParts[0] !== "agendamento" ||
    !pathParts[1]
  ) {
    return null;
  }

  try {
    return decodeURIComponent(pathParts[1]);
  } catch {
    return null;
  }
};

function App() {
  const [mode, setMode] =
    useState<ScreenMode>("login");

  const [session, setSession] =
    useState<Session | null>(null);

  const [checkingSession, setCheckingSession] =
    useState(true);

  const publicBookingSlug =
    getPublicBookingSlug();

  const appointmentManagementToken =
    getAppointmentManagementToken();

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      setSession(currentSession);
      setCheckingSession(false);
    };

    void checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);

        if (event === "PASSWORD_RECOVERY") {
          setMode("reset");
        }

        if (event === "SIGNED_OUT") {
          setMode("login");
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const { error } =
      await supabase.auth.signOut();

    if (error) {
      console.error(
        "Erro ao sair da conta:",
        error.message
      );
    }
  };

  if (appointmentManagementToken) {
    return (
      <BookingManagement
        token={appointmentManagementToken}
      />
    );
  }

  if (publicBookingSlug) {
    return (
      <PublicBooking
        slug={publicBookingSlug}
      />
    );
  }

  if (checkingSession) {
    return (
      <main className="login-page">
        <div className="auth-loading">
          <span className="spinner"></span>
        </div>
      </main>
    );
  }

  if (session && mode !== "reset") {
    return (
      <Dashboard
        userEmail={
          session.user.email ??
          "Usuário AgendaPro"
        }
        onLogout={handleLogout}
      />
    );
  }

  return (
    <main className="login-page">
      <section className="login-card">
        {mode === "login" && (
          <Login
            onRegister={() =>
              setMode("register")
            }
            onForgotPassword={() =>
              setMode("forgot")
            }
          />
        )}

        {mode === "register" && (
          <Register
            onBackToLogin={() =>
              setMode("login")
            }
          />
        )}

        {mode === "forgot" && (
          <ForgotPassword
            onBackToLogin={() =>
              setMode("login")
            }
          />
        )}

        {mode === "reset" && (
          <ResetPassword
            onBackToLogin={async () => {
              window.history.replaceState(
                {},
                "",
                "/"
              );

              await supabase.auth.signOut();
              setMode("login");
            }}
          />
        )}
      </section>
    </main>
  );
}

export default App;
