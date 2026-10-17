import { ViewTransition, type ReactNode } from "react";

// Envolve o conteúdo de cada página do site: na troca de página o conteúdo antigo esmaece
// e o novo sobe de leve (animações em globals.css). O menu tem nome próprio e fica parado.
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      {children}
    </ViewTransition>
  );
}
