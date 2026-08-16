"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardIcon } from "../dashboard-icons/DashboardIcon";
import styles from "./DashboardSidebar.module.css";

const navigation = [
  { label: "Visão geral", icon: "overview", href: "/dashboard", badge: undefined },
  { label: "Plantações", icon: "field", href: "/dashboard/plantacoes", badge: undefined },
  { label: "Sensores", icon: "sensor", href: "/dashboard#dispositivos", badge: undefined },
  { label: "Missões", icon: "mission", href: "/dashboard#atividade", badge: undefined },
  { label: "Alertas", icon: "alert", href: "/dashboard#alertas", badge: "2" },
] as const;

type DashboardSidebarProps = {
  open: boolean;
  onClose: () => void;
};

export function DashboardSidebar({ open, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <button className={`${styles.backdrop} ${open ? styles.backdropVisible : ""}`} type="button" aria-label="Fechar menu" onClick={onClose} />
      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}>
        <div className={styles.brand}>
          <span className={styles.logo}><Image src="/techsoil-mark.png" alt="" width={140} height={140} priority /></span>
          <span><strong>TECHSOIL</strong><small>SYSTEMS</small></span>
        </div>

        <div className={styles.plantation}>
          <span className={styles.plantationMark}>FF</span>
          <span><small>PROPRIEDADE</small><strong>Fazenda Ferragut</strong></span>
          <DashboardIcon name="chevron" size={16} />
        </div>

        <nav className={styles.navigation} aria-label="Navegação do painel">
          <p>MONITORAMENTO</p>
          {navigation.map((item) => {
            const isActive = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);

            return (
            <Link className={isActive ? styles.active : ""} href={item.href} key={item.label} onClick={onClose}>
              <DashboardIcon name={item.icon} />
              <span>{item.label}</span>
              {item.badge && <b>{item.badge}</b>}
            </Link>
          );})}
        </nav>

        <nav className={styles.navigation} aria-label="Configurações">
          <p>GESTÃO</p>
          <a href="/dashboard#equipe" onClick={onClose}><DashboardIcon name="team" /><span>Equipe</span></a>
          <a href="/dashboard#configuracoes" onClick={onClose}><DashboardIcon name="settings" /><span>Configurações</span></a>
        </nav>

        <div className={styles.supportCard}>
          <span>?</span>
          <strong>Precisa de ajuda?</strong>
          <p>Nossa equipe está por perto.</p>
          <a href="mailto:contato@techsoil.com.br">Falar com suporte</a>
        </div>

        <div className={styles.profile}>
          <span>AF</span>
          <div><strong>Arthur Ferragut</strong><small>Proprietário</small></div>
          <button type="button" aria-label="Opções do perfil">•••</button>
        </div>
      </aside>
    </>
  );
}
