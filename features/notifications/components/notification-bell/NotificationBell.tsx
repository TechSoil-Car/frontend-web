"use client";

import { useState } from "react";
import Link from "next/link";
import { DashboardIcon } from "@/features/dashboard/components/dashboard-icons/DashboardIcon";
import { Modal } from "@/shared/components/modal/Modal";
import { useNotifications } from "../../hooks/use-notifications";
import { NotificationCard } from "../notification-card/NotificationCard";
import styles from "../Notifications.module.css";

export function NotificationBell({ plantationId }: { plantationId?: string }) {
  const [open, setOpen] = useState(false);
  const { data, error, busy, markRead, reload } = useNotifications(
    plantationId,
    1,
    "unread",
  );
  return (
    <>
      <button
        className={styles.bell}
        type="button"
        disabled={!plantationId}
        aria-label={`Notificações${data ? `: ${data.unread} não lidas` : ""}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setOpen(true);
          void reload();
        }}
      >
        <DashboardIcon name="bell" size={19} />
        {Boolean(data?.unread) && (
          <span>{data!.unread > 99 ? "99+" : data!.unread}</span>
        )}
      </button>
      {open && (
        <Modal
          title="Notificações"
          kicker="SUA PLANTAÇÃO"
          busy={busy}
          onClose={() => setOpen(false)}
        >
          <div className={styles.modalTop}>
            <p>{data ? `${data.unread} não lidas` : "Carregando..."}</p>
            <button
              type="button"
              disabled={busy || !data?.unread}
              onClick={() => void markRead()}
            >
              Marcar todas como lidas
            </button>
          </div>
          {error && (
            <div className={styles.error} role="alert">
              {error}
              <button
                type="button"
                disabled={busy}
                onClick={() => void reload()}
              >
                Tentar novamente
              </button>
            </div>
          )}
          {data && !data.data.length && (
            <p className={styles.empty}>
              Tudo em dia! Nenhuma notificação não lida.
            </p>
          )}
          <div className={styles.preview}>
            {data?.data.slice(0, 5).map((item) => (
              <NotificationCard
                key={item.id}
                item={item}
                busy={busy}
                onRead={() => void markRead(item.id)}
              />
            ))}
          </div>
          <Link
            className={styles.historyLink}
            href="/dashboard/notificacoes"
            onClick={() => setOpen(false)}
          >
            Ver histórico e preferências de e-mail →
          </Link>
        </Modal>
      )}
    </>
  );
}
