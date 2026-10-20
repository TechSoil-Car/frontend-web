import Link from "next/link";
import { AlertFeed, SensorLive } from "@/app/landing-interactions";
import { PANEL_OFFLINE } from "@/shared/api/api-client";
import { AuthShell } from "../auth-shell/AuthShell";
import { LoginForm } from "../login-form/LoginForm";
import form from "../auth-form/AuthForm.module.css";
import styles from "./LoginScreen.module.css";

// Versão publicada só com o site: o painel aparece na demonstração ao vivo.
function PanelOfflineNotice() {
  return (
    <div className={form.form}>
      <p className={form.note} role="status">
        <strong>O painel não está disponível nesta versão online do site.</strong> Ele funciona junto com os sensores
        de campo e é apresentado na demonstração ao vivo do projeto.
      </p>
      <Link className={form.submit} href="/plataforma">
        Ver como funciona a plataforma
      </Link>
    </div>
  );
}

// Painel da direita: os mesmos widgets animados da home, com dados de exemplo.
function LoginAside() {
  return (
    <div className={styles.aside}>
      <p className={styles.live}>
        <i aria-hidden="true" /> Exemplo · Fazenda Boa Vista
      </p>
      <h2>
        Enquanto você esteve fora,{" "}
        <br />
        <mark>o solo continuou falando.</mark>
      </h2>
      <div className={styles.widgets}>
        <div className={`${styles.frame} ${styles.sensor}`}>
          <SensorLive />
        </div>
        <div className={`${styles.frame} ${styles.alerts}`}>
          <AlertFeed />
        </div>
      </div>
      <p className={styles.caption}>Leituras a cada minuto e alertas assim que algo sai da faixa.</p>
    </div>
  );
}

export function LoginScreen() {
  return (
    <AuthShell
      label="Área do cliente"
      title={
        <>
          Bom te ver{" "}
          <br />
          <mark>de novo.</mark>
        </>
      }
      lead="Entre para acompanhar as leituras, o mapa e os alertas da sua propriedade."
      aside={<LoginAside />}
      asideLabel="Exemplo do painel TechSoil"
      footer={
        <>
          Ainda não tem acesso? A conta é criada pela nossa equipe depois da contratação, ou por convite de quem já
          usa a TechSoil. <Link href="/#orcamento">Solicitar proposta</Link>
        </>
      }
    >
      {PANEL_OFFLINE ? <PanelOfflineNotice /> : <LoginForm />}
    </AuthShell>
  );
}
