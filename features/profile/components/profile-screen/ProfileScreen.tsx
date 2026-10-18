"use client";

import { useAuth } from "@/features/auth/context/AuthContext";
import { useProfile } from "../../hooks/use-profile";
import { PasswordForm } from "./PasswordForm";
import { ProfileForm } from "./ProfileForm";
import { SessionCard } from "./SessionCard";
import styles from "./ProfileScreen.module.css";

export function ProfileScreen() {
  const { user, updateProfile, completePasswordChange } = useAuth();
  const { profile, error: loadError, retry } = useProfile();

  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <p>MINHA CONTA</p>
        <h1>Meu perfil</h1>
        <span>Suas informações e a segurança da sua conta TechSoil.</span>
      </header>
      {!profile ? (
        loadError ? (
          <section className={styles.card}>
            <p role="alert">{loadError}</p>
            <button
              type="button"
              onClick={retry}
            >
              Tentar novamente
            </button>
          </section>
        ) : (
          <p role="status">Carregando seu perfil...</p>
        )
      ) : (
        <div className={styles.grid}>
          <section
            className={`${styles.card} ${styles.summary}`}
            aria-label="Resumo da conta"
          >
            <span className={styles.avatar} aria-hidden="true">
              {(user?.name ?? profile.name)
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part[0])
                .join("")
                .toUpperCase()}
            </span>
            <div className={styles.identity}>
              <h2>{user?.name ?? profile.name}</h2>
              <p>
                {profile.systemRole === "SUPERADMIN"
                  ? "Superadmin da plataforma"
                  : "Usuário TechSoil"}
              </p>
              <span>{profile.email}</span>
            </div>
            <span className={styles.accountStatus}>
              <i aria-hidden="true" /> Conta ativa
            </span>
          </section>
          <ProfileForm
            key={profile.id}
            profile={profile}
            onSave={updateProfile}
          />
          <PasswordForm
            onSuccess={completePasswordChange}
            email={user?.email ?? profile.email}
          />
          <SessionCard />
        </div>
      )}
    </main>
  );
}
