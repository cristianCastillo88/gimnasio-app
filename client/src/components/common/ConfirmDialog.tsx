import React from "react";
import { Button } from "./Button";

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  isDestructive = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onCancel}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(4px)",
          zIndex: 130,
          animation: "fadeIn 0.2s ease",
        }}
      />

      {/* Dialog Drawer / Sheet */}
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          maxWidth: "440px",
          margin: "0 auto",
          backgroundColor: "var(--bg-surface)",
          borderTop: "1px solid var(--border-default)",
          borderTopLeftRadius: "var(--radius-lg)",
          borderTopRightRadius: "var(--radius-lg)",
          padding: "20px 20px calc(var(--safe-bottom) + 20px) 20px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          zIndex: 140,
          boxShadow: "0 -8px 30px rgba(0, 0, 0, 0.7)",
          animation: "slideUp 0.22s ease",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h3 id="confirm-dialog-title" style={{ fontSize: "1.1875rem", color: "var(--text-primary)", margin: 0 }}>
            {title}
          </h3>
          <p id="confirm-dialog-desc" style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "6px", lineHeight: 1.4 }}>
            {description}
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
          <Button
            variant="secondary"
            size="md"
            style={{ flex: 1 }}
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>

          <Button
            variant={isDestructive ? "danger" : "primary"}
            size="md"
            style={{ flex: 1.2 }}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </>
  );
};
