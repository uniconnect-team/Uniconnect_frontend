import { createPortal } from "react-dom";

export function ModalPortal({ children }: { children: React.ReactNode }) {
  const modalRoot = document.getElementById("modal-root");
  return modalRoot ? createPortal(children, modalRoot) : null;
}
