import type { FormEvent } from "react";
import { DashboardIcon } from "@/features/dashboard/components/dashboard-icons/DashboardIcon";
import styles from "./SensorsScreen.module.css";

/** Cadastro de sensor pelo identificador físico configurado no firmware. */
export function CreateSensorDialog({
  creating,
  error,
  onClose,
  onSubmit,
}: {
  creating: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className={styles.modalLayer}>
      <button
        className={styles.modalBackdrop}
        type="button"
        aria-label="Fechar cadastro"
        onClick={() => !creating && onClose()}
      />
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sensor-modal-title"
      >
        <div className={styles.modalHead}>
          <span>
            <DashboardIcon name="sensor" />
          </span>
          <div>
            <p>NOVO DISPOSITIVO</p>
            <h2 id="sensor-modal-title">Cadastrar sensor</h2>
          </div>
          <button
            type="button"
            onClick={() => onClose()}
            disabled={creating}
          >
            ×
          </button>
        </div>
        <form className={styles.createForm} onSubmit={onSubmit}>
          <label htmlFor="sensor-name">Nome do sensor</label>
          <input
            id="sensor-name"
            name="name"
            minLength={2}
            maxLength={120}
            placeholder="Ex.: Sensor Norte"
            autoFocus
            required
            disabled={creating}
          />
          <label htmlFor="sensor-device-id">Identificador físico</label>
          <input
            id="sensor-device-id"
            name="deviceId"
            minLength={3}
            maxLength={80}
            pattern="[A-Za-z0-9][A-Za-z0-9_-]{2,79}"
            placeholder="Ex.: sensor_01"
            required
            disabled={creating}
          />
          <small>Use o mesmo identificador configurado no firmware.</small>
          {error && (
            <p className={styles.formError} role="alert">
              {error}
            </p>
          )}
          <div className={styles.formActions}>
            <button
              type="button"
              onClick={() => onClose()}
              disabled={creating}
            >
              Cancelar
            </button>
            <button type="submit" disabled={creating}>
              {creating ? "Cadastrando..." : "Cadastrar sensor"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
