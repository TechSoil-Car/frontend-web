import Image from "next/image";
import styles from "./TechSoilBrand.module.css";

export function TechSoilBrand() {
  return (
    <header className={styles.brand} aria-label="TechSoil Systems">
      <span className={styles.mark} aria-hidden="true">
        <Image src="/techsoil-mark.png" alt="" width={144} height={144} priority />
      </span>
      <span className={styles.name}>
        <strong>TECHSOIL</strong>
        <small>SYSTEMS</small>
      </span>
    </header>
  );
}
