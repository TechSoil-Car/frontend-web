import Image from "next/image";
import styles from "./page.module.css";

export function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path d="M4 10h11M11 6l4 4-4 4" />
    </svg>
  );
}

export function Brand({ inverted = false }: { inverted?: boolean }) {
  return (
    <span className={`${styles.brand} ${inverted ? styles.brandInverted : ""}`}>
      <span className={styles.brandMark}>
        <Image src="/techsoil-mark.png" alt="" width={128} height={128} />
      </span>
      <span>
        <strong>TECHSOIL</strong>
        <small>SYSTEMS</small>
      </span>
    </span>
  );
}
