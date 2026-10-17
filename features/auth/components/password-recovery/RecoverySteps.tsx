import styles from "./RecoverySteps.module.css";

const steps = [
  { title: "Peça o link", text: "Informe o e-mail que você usa para entrar." },
  { title: "Abra o e-mail", text: "O link vale por 30 minutos. Confira também o spam." },
  { title: "Crie a nova senha", text: "As sessões abertas são encerradas por segurança." },
  { title: "Entre de novo", text: "Use a nova senha no login." },
];

// Painel da direita na recuperação de senha: os passos, com o atual em destaque.
// `current` vai de 0 a 3; com 4 todos aparecem concluídos.
export function RecoverySteps({ current }: { current: number }) {
  return (
    <div className={styles.wrap}>
      <p className={styles.kicker}>Recuperação de acesso</p>
      <h2>
        Em quatro passos{" "}
        <br />
        <mark>você está de volta.</mark>
      </h2>
      <ol className={styles.steps}>
        {steps.map((step, index) => {
          const state = index < current ? "done" : index === current ? "current" : "next";
          return (
            <li key={step.title} data-state={state} aria-current={state === "current" ? "step" : undefined}>
              <i aria-hidden="true">{state === "done" ? "✓" : index + 1}</i>
              <div>
                <strong>{step.title}</strong>
                <span>{step.text}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
