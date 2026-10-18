"use client";

import { useEmailPreference } from "../../hooks/use-email-preference";
import styles from "../Notifications.module.css";

/** Opt-in pessoal de alertas por e-mail. */
export function EmailPreference() {
  const { enabled, busy, error, retry, toggle } = useEmailPreference();
  return (
    <section className={styles.preference} aria-labelledby="email-preference">
      <div>
        <h2 id="email-preference">Alertas por e-mail</h2>
        <p>
          Receba novos alertas de todas as suas plantações no e-mail da sua
          conta, mesmo fora do painel. Uma mensagem por ocorrência; sem envio
          retroativo.
        </p>
        <small>
          O envio depende do provedor de e-mail configurado. Falhas ficam
          indicadas no histórico.
        </small>
        {error && (
          <p className={styles.error} role="alert">
            {error}{" "}
            <button
              type="button"
              onClick={retry}
            >
              Tentar novamente
            </button>
          </p>
        )}
      </div>
      <label className={styles.emailToggle}>
        <input
          type="checkbox"
          checked={enabled === true}
          disabled={busy || enabled === null}
          onChange={() => void toggle()}
        />
        <span>
          {busy
            ? "Salvando..."
            : enabled === null
              ? "Carregando..."
              : enabled
                ? "Ativado"
                : "Desativado"}
        </span>
      </label>
    </section>
  );
}
