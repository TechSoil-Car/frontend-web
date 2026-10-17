"use client";

import { useState, type ChangeEvent, type KeyboardEvent } from "react";
import { EyeIcon } from "../icons/EyeIcon";
import styles from "./AuthForm.module.css";

type PasswordInputProps = {
  id: string;
  name: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  disabled?: boolean;
  minLength?: number;
  maxLength?: number;
  placeholder?: string;
  onChange?: (value: string) => void;
};

// Campo de senha com botão de mostrar/ocultar e aviso de Caps Lock ligado.
export function PasswordInput({ id, name, label, autoComplete, disabled, minLength = 8, maxLength = 72, placeholder, onChange }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  const checkCapsLock = (event: KeyboardEvent<HTMLInputElement>) => setCapsLock(event.getModifierState("CapsLock"));

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <div className={styles.passwordField}>
        <input
          className={styles.input}
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          minLength={minLength}
          maxLength={maxLength}
          placeholder={placeholder}
          disabled={disabled}
          required
          aria-describedby={capsLock ? `${id}-caps` : undefined}
          onKeyDown={checkCapsLock}
          onKeyUp={checkCapsLock}
          onBlur={() => setCapsLock(false)}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onChange?.(event.target.value)}
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={visible}
          disabled={disabled}
        >
          <EyeIcon open={visible} />
        </button>
      </div>
      {capsLock && (
        <p className={styles.capsLock} id={`${id}-caps`} role="status">
          ⇪ Caps Lock está ligado
        </p>
      )}
    </div>
  );
}

// Requisitos da senha nova, marcados enquanto a pessoa digita. As regras são as mesmas
// validadas no envio (8 a 72 caracteres, até 72 bytes, confirmação igual).
export function PasswordChecklist({ password, confirmation }: { password: string; confirmation?: string }) {
  const bytes = new TextEncoder().encode(password).length;
  const items = [
    { ok: password.length >= 8, text: "Pelo menos 8 caracteres" },
    { ok: password.length > 0 && bytes <= 72, text: "Até 72 bytes (acentos e emojis contam mais)" },
    ...(confirmation !== undefined
      ? [{ ok: password.length > 0 && password === confirmation, text: "As duas senhas iguais" }]
      : []),
  ];

  return (
    <ul className={styles.checklist} aria-label="Requisitos da senha">
      {items.map((item) => (
        <li key={item.text} data-ok={item.ok ? "" : undefined}>
          <i aria-hidden="true">{item.ok ? "✓" : ""}</i>
          {item.text}
          <span className={styles.srOnly}>{item.ok ? " (atendido)" : " (pendente)"}</span>
        </li>
      ))}
    </ul>
  );
}
