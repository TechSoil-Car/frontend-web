import type { NotificationItem } from "./notifications-api";
import styles from "./Notifications.module.css";

const emailLabels: Record<string, string> = {
  disabled: "E-mail desativado na detecção",
  pending: "E-mail na fila",
  sending: "Enviando e-mail",
  sent: "E-mail enviado",
  failed: "Falha no envio do e-mail",
  cancelled: "Envio de e-mail cancelado",
};
export function NotificationCard({
  item,
  busy,
  onRead,
}: {
  item: NotificationItem;
  busy: boolean;
  onRead: () => void;
}) {
  return (
    <article className={`${styles.item} ${!item.readAt ? styles.unread : ""}`}>
      <div className={styles.itemHead}>
        <span
          className={
            item.event.severity === "critical"
              ? styles.critical
              : styles.warning
          }
        >
          {item.event.severity === "critical" ? "Crítico" : "Atenção"}
        </span>
        <span>
          {item.event.resolvedAt ? "Encerrado" : "Em andamento"}
          {!item.readAt ? " · Não lido" : " · Lido"}
        </span>
      </div>
      <h3>{item.event.title}</h3>
      <p>
        <strong>{item.event.deviceName}</strong> · {item.event.deviceId}
      </p>
      <p>{item.event.message}</p>
      <small>
        Detectado em {new Date(item.event.detectedAt).toLocaleString("pt-BR")}
      </small>
      {item.event.resolvedAt && (
        <small>
          Encerrado em {new Date(item.event.resolvedAt).toLocaleString("pt-BR")}
        </small>
      )}
      <footer>
        <small>
          {emailLabels[item.emailStatus] ?? "Estado de envio indisponível"}
        </small>
        {!item.readAt && (
          <button type="button" disabled={busy} onClick={onRead}>
            Marcar como lido
          </button>
        )}
      </footer>
    </article>
  );
}
