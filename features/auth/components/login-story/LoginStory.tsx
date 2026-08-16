import { TechSoilBrand } from "../techsoil-brand/TechSoilBrand";
import styles from "./LoginStory.module.css";

export function LoginStory() {
  return (
    <div className={styles.story}>
      <TechSoilBrand />

      <div className={styles.copy}>
        <p className={styles.eyebrow}><i /> Tecnologia que nasce no campo</p>
        <h1>Da terra à decisão<span>.</span></h1>
        <p className={styles.description}>Acompanhe a saúde do seu solo, entenda o que está acontecendo na sua plantação e produza com mais precisão.</p>
      </div>

      <div className={styles.footer}>
        <span><i /> Dados do campo em tempo real</span>
        <span><i /> Decisões mais precisas</span>
      </div>
    </div>
  );
}
