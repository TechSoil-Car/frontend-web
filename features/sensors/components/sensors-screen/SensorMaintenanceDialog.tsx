"use client";

import { type FormEvent, useState } from "react";
import { ApiError } from "@/shared/api/api-client";
import { Modal } from "@/shared/components/modal/Modal";
import styles from "@/shared/components/modal/Modal.module.css";
import * as sensorsApi from "../../services/sensors-api";
import type { Device } from "../../types/sensor.types";

export function SensorMaintenanceDialog({
  device,
  action,
  onClose,
  onUpdated,
  onRemoved,
}: {
  device: Device;
  action: "edit" | "remove";
  onClose: () => void;
  onUpdated: (device: Device) => void;
  onRemoved: (device: Device) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const removing = action === "remove";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const name = String(
      new FormData(event.currentTarget).get("name") ?? "",
    ).trim();
    if (removing && confirmation.trim() !== device.deviceId) return;
    if (!removing && name.length < 2) {
      setError("Informe um nome com pelo menos 2 caracteres.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (removing) {
        await sensorsApi.removeSensor(device.plantationId, device.deviceId);
        onRemoved(device);
      } else {
        onUpdated(
          await sensorsApi.updateSensor(
            device.plantationId,
            device.deviceId,
            name,
          ),
        );
      }
    } catch (error) {
      setError(
        error instanceof ApiError
          ? error.message
          : "Não foi possível concluir. Verifique sua conexão e tente novamente.",
      );
      setBusy(false);
    }
  }

  return (
    <Modal
      title={removing ? "Remover sensor" : "Editar sensor"}
      kicker="MANUTENÇÃO DO DISPOSITIVO"
      busy={busy}
      onClose={onClose}
    >
      {removing ? (
        <>
          <p className={styles.warning}>
            O sensor <strong>{device.name}</strong> ({device.deviceId}) deixará
            de aparecer nesta plantação, no mapa e nos alertas do painel.
          </p>
          <p className={styles.note}>
            Esta ação remove somente o cadastro no Backend Web. Não desliga o
            dispositivo, não interrompe o envio MQTT e não apaga as leituras
            armazenadas no Backend IoT. Se o mesmo identificador for cadastrado
            novamente, seu histórico poderá voltar a aparecer.
          </p>
        </>
      ) : (
        <p className={styles.intro}>
          Altere o nome de exibição. O identificador configurado no firmware, a
          plantação e o histórico não serão modificados.
        </p>
      )}
      <form onSubmit={submit} className={styles.form}>
        {removing ? (
          <>
            <label htmlFor="confirm-sensor">
              Digite “{device.deviceId}” para confirmar
            </label>
            <input
              id="confirm-sensor"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="off"
              disabled={busy}
              required
            />
          </>
        ) : (
          <>
            <label htmlFor="edit-sensor-name">Nome do sensor</label>
            <input
              id="edit-sensor-name"
              name="name"
              defaultValue={device.name}
              minLength={2}
              maxLength={120}
              required
              disabled={busy}
            />
            <label htmlFor="edit-sensor-id">Identificador físico</label>
            <input id="edit-sensor-id" value={device.deviceId} readOnly />
            <small>
              O identificador físico não pode ser alterado pela edição do
              cadastro.
            </small>
          </>
        )}
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <div className={styles.actions}>
          <button type="button" disabled={busy} onClick={onClose}>
            Cancelar
          </button>
          <button
            type="submit"
            className={removing ? styles.danger : undefined}
            disabled={
              busy || (removing && confirmation.trim() !== device.deviceId)
            }
          >
            {busy
              ? "Aguarde..."
              : removing
                ? "Remover sensor"
                : "Salvar alterações"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
