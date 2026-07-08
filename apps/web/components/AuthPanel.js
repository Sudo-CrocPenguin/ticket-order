"use client";

import { useState } from "react";
import { Lock, LogIn, UserPlus } from "lucide-react";
import { hasSupabaseConfig } from "@/lib/supabase";
import { signIn, signUp } from "@/lib/ticketApi";

export default function AuthPanel({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isRegister = mode === "register";

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const session = isRegister
        ? await signUp({ name, email, password })
        : await signIn({ email, password });

      if (session) {
        onAuthenticated(session);
        return;
      }

      setMessage("Cuenta creada. Revisa Supabase Auth si pide confirmar correo.");
    } catch (submitError) {
      setError(submitError.message || "No se pudo iniciar sesion.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-screen">
      <section className="auth-panel">
        <div className="brand-lockup">
          <img alt="Ticket Order" className="brand-logo" src="/logo.png" />
          <div>
            <h1>Ticket Order</h1>
            <p>Panel web para gestionar tickets por empresa.</p>
          </div>
        </div>

        {!hasSupabaseConfig ? (
          <div className="notice danger">
            Configura `apps/web/.env.local` con `NEXT_PUBLIC_SUPABASE_URL` y
            `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
          </div>
        ) : null}

        <div className="segmented">
          <button
            className={mode === "login" ? "active" : ""}
            onClick={() => setMode("login")}
            type="button"
          >
            <LogIn size={16} />
            Entrar
          </button>
          <button
            className={mode === "register" ? "active" : ""}
            onClick={() => setMode("register")}
            type="button"
          >
            <UserPlus size={16} />
            Crear cuenta
          </button>
        </div>

        <form className="form-stack" onSubmit={submit}>
          {isRegister ? (
            <label>
              Nombre
              <input
                autoComplete="name"
                onChange={(event) => setName(event.target.value)}
                placeholder="Nombre completo"
                required
                value={name}
              />
            </label>
          ) : null}

          <label>
            Correo
            <input
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@empresa.com"
              required
              type="email"
              value={email}
            />
          </label>

          <label>
            Contrasena
            <input
              autoComplete={isRegister ? "new-password" : "current-password"}
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimo 8 caracteres"
              required
              type="password"
              value={password}
            />
          </label>

          {error ? <div className="notice danger">{error}</div> : null}
          {message ? <div className="notice success">{message}</div> : null}

          <button className="primary-button" disabled={!hasSupabaseConfig || isSubmitting}>
            <Lock size={17} />
            {isSubmitting ? "Procesando" : isRegister ? "Crear cuenta" : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}
