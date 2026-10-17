import styles from "./InviteBadge.module.css";

export type InviteBadgeState = "loading" | "ready" | "accepted" | "invalid";

type InviteBadgeProps = {
  state: InviteBadgeState;
  name?: string;
  email?: string;
  plantation?: string | null;
};

const captions: Record<InviteBadgeState, string> = {
  loading: "Conferindo seu convite...",
  ready: "Seu crachá está quase pronto. Só falta a senha.",
  accepted: "Crachá ativado. Bem-vindo à equipe!",
  invalid: "Este convite não pode mais ser usado.",
};

function initials(name?: string) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return `${parts[0][0]}${parts.length > 1 ? parts[parts.length - 1][0] : ""}`.toUpperCase();
}

// "Código de barras" decorativo: a largura de cada barra vem das letras do e-mail.
function Barcode({ seed }: { seed: string }) {
  const bars = Array.from({ length: 28 }, (_, index) => 1 + ((seed.charCodeAt(index % Math.max(seed.length, 1)) || 7) + index) % 3);
  let x = 0;
  return (
    <svg className={styles.barcode} viewBox="0 0 120 24" preserveAspectRatio="none" aria-hidden="true">
      {bars.map((width, index) => {
        const bar = index % 2 === 0 ? <rect key={index} x={x} width={width} height="24" /> : null;
        x += width + 1.4;
        return bar;
      })}
    </svg>
  );
}

// Crachá pendurado no cordão, como os da Bentotec, com os dados do convite.
export function InviteBadge({ state, name, email, plantation }: InviteBadgeProps) {
  const loading = state === "loading";

  return (
    <div className={styles.scene}>
      <div className={styles.stage} data-state={state} aria-hidden="true">
        <div className={styles.strap}>
          <span>TECHSOIL · TECHSOIL · TECHSOIL · TECHSOIL</span>
        </div>
        <div className={styles.clip} />
        <div className={styles.badge}>
          <div className={styles.slot} />
          <header>
            <span>Convite</span>
            <b>TechSoil Systems</b>
          </header>
          <div className={styles.body}>
            <i className={loading ? styles.skeleton : undefined}>{loading ? "" : initials(name)}</i>
            {loading ? (
              <>
                <span className={`${styles.skeleton} ${styles.skeletonLine}`} />
                <span className={`${styles.skeleton} ${styles.skeletonShort}`} />
              </>
            ) : (
              <>
                <strong>{name || "Convidado"}</strong>
                <small>{email || "—"}</small>
              </>
            )}
          </div>
          <dl>
            <dt>Acesso a</dt>
            <dd>{loading ? "..." : plantation || "Plataforma TechSoil"}</dd>
          </dl>
          <footer>
            <Barcode seed={email ?? "techsoil"} />
          </footer>
          {state === "accepted" && <span className={styles.stamp}>Ativo</span>}
          {state === "invalid" && <span className={`${styles.stamp} ${styles.stampInvalid}`}>Indisponível</span>}
        </div>
      </div>
      <p className={styles.caption}>
        {captions[state]}
      </p>
    </div>
  );
}
