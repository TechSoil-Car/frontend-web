"use client";

import { useRef, useState } from "react";
import { prefersReducedMotion, Reveal } from "../landing-interactions";
import styles from "./sobre.module.css";

// Biografias enviadas pela equipe; os destaques repetem conquistas citadas no próprio texto.
const students = [
  {
    name: "Arthur Dombroski",
    fullName: "Arthur Bianchi de Barros Maia Dombroski",
    highlights: ["1º lugar · Hackathon Bosch 2025", "2º lugar · Hackathon Bosch 2026", "2º lugar · Bentotec 2025"],
    bio: [
      "Cursa o Ensino Médio integrado ao Técnico em Desenvolvimento de Sistemas na ETEC Bento Quirino. Durante sua formação, participou do projeto Hackteen, da Venturus, no qual desenvolveu um backend.",
      "Em 2025, conquistou o primeiro lugar no Hackathon Bosch com o PDFly, uma plataforma web para consultar o conteúdo de arquivos PDF por meio de perguntas e respostas geradas por inteligência artificial. Em 2026, obteve o segundo lugar no Hackathon Bosch com um aplicativo para monitoramento de linhas de ônibus. Também integrou o projeto TechSoil-Car, segundo colocado na Bentotec de 2025.",
      "Participou das olimpíadas Canguru de Matemática, OBMEP e OBS, alcançando a segunda fase da OBMEP em 2025. Pretende continuar seus estudos em Análise e Desenvolvimento de Sistemas na FATEC.",
    ],
  },
  {
    name: "Mateus Pinheiro Silva",
    fullName: "Mateus Pinheiro Silva",
    highlights: ["Hackathon Bosch 2025", "2º lugar · Bentotec 2025"],
    bio: [
      "Cursa o Ensino Médio integrado ao Técnico em Desenvolvimento de Sistemas na ETEC Bento Quirino. Ao longo do curso, participou de projetos em parceria com Bosch e Venturus. Na parceria com a Venturus, integrou a equipe responsável pelo desenvolvimento de um backend, apresentado a executivos da empresa.",
      "Participou do Hackathon Bosch em 2025 e do desenvolvimento do TechSoil-Car, projeto que conquistou o segundo lugar na Bentotec no mesmo ano. Essas atividades compõem sua experiência escolar com desenvolvimento de sistemas e trabalho em equipe.",
      "Pretende prosseguir sua formação em Análise e Desenvolvimento de Sistemas na FATEC.",
    ],
  },
  {
    name: "Murilo Firmo",
    fullName: "Murilo Firmo Sola",
    highlights: ["2º lugar · Hackathon Bosch 2025", "2º lugar · Bentotec 2025"],
    bio: [
      "Cursa o Ensino Médio integrado ao Técnico em Desenvolvimento de Sistemas na ETEC Bento Quirino. Durante sua formação, integrou uma equipe de projeto em parceria com a Venturus, participando do desenvolvimento de um backend apresentado a executivos da empresa.",
      "Em 2025, conquistou o segundo lugar no Hackathon Bosch e participou do desenvolvimento do TechSoil-Car, segundo colocado na Bentotec no mesmo ano. Sua trajetória no ensino médio inclui, assim, projetos de desenvolvimento de sistemas e participação em eventos de tecnologia.",
      "Pretende aprofundar sua formação no curso de Análise e Desenvolvimento de Sistemas da FATEC.",
    ],
  },
];

const advisors = [
  { name: "Simone Medeiros Lacerda", role: "Orientadora" },
  { name: "Leonardo Augusto Arruda", role: "Coorientador" },
];

function initials(name: string) {
  const parts = name.split(" ");
  return `${parts[0][0]}${parts[parts.length - 1][0]}`;
}

export function Team() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState(0);
  const student = students[active];

  const open = (index: number) => {
    setActive(index);
    dialogRef.current?.showModal();
  };

  // Toca a animação de saída antes de fechar de fato.
  const close = () => {
    const dialog = dialogRef.current;
    if (!dialog?.open) return;
    if (prefersReducedMotion()) {
      dialog.close();
      return;
    }
    dialog.dataset.closing = "";
    dialog.addEventListener(
      "animationend",
      () => {
        delete dialog.dataset.closing;
        dialog.close();
      },
      { once: true },
    );
  };

  return (
    <>
      <div className={styles.people}>
        {students.map((item, index) => (
          <Reveal key={item.name} delay={index * 100}>
            <button
              type="button"
              className={`${styles.person} ${styles.personButton}`}
              onClick={() => open(index)}
              aria-haspopup="dialog"
            >
              <i aria-hidden="true">{initials(item.name)}</i>
              <strong>{item.name}</strong>
              <span>Estudante · ETEC Bento Quirino</span>
              <b>Ler biografia →</b>
            </button>
          </Reveal>
        ))}
        {advisors.map((advisor, index) => (
          <Reveal key={advisor.name} delay={(index + 3) * 100}>
            <div className={`${styles.person} ${styles.advisor}`}>
              <i aria-hidden="true">{initials(advisor.name)}</i>
              <strong>{advisor.name}</strong>
              <span>{advisor.role}</span>
            </div>
          </Reveal>
        ))}
      </div>

      <dialog
        ref={dialogRef}
        className={styles.bio}
        aria-labelledby="bio-titulo"
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onClick={(event) => {
          // Clique no fundo escurecido (fora do cartão) fecha.
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className={styles.bioCard}>
          <button type="button" className={styles.bioClose} onClick={close} aria-label="Fechar biografia">
            ×
          </button>
          <header>
            <i aria-hidden="true">{initials(student.name)}</i>
            <div>
              <small>Estudante · ETEC Bento Quirino</small>
              <h3 id="bio-titulo">{student.fullName}</h3>
            </div>
          </header>
          <ul className={styles.bioHighlights}>
            {student.highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {student.bio.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </dialog>
    </>
  );
}
