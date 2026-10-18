"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/context/AuthContext";
import styles from "./ProfileScreen.module.css";

export function SessionCard() {
  const { logout } = useAuth();
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogout() {
    setLeaving(true);
    setError(null);
    try {
      await logout();
      router.replace("/login");
    } catch {
      setError(
        "Não foi possível encerrar a sessão. Verifique sua conexão e tente novamente.",
      );
      setLeaving(false);
    }
  }

  return (
    <section
      className={`${styles.card} ${styles.session}`}
      aria-label="Sessão atual"
    >
      <div>
        <h2>Sessão atual</h2>
        <p>Encerre seu acesso à TechSoil neste navegador.</p>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </div>
      <button
        className={styles.logoutButton}
        type="button"
        onClick={handleLogout}
        disabled={leaving}
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5M14 8l4 4-4 4M8 12h13" />
        </svg>
        {leaving ? "Saindo..." : "Sair da conta"}
      </button>
    </section>
  );
}
