import React, { useState, useEffect } from "react";

export const NetworkStatusBadge: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== "undefined" && typeof navigator.onLine === "boolean"
      ? navigator.onLine
      : true;
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 10px",
        borderRadius: "var(--radius-full)",
        backgroundColor: isOnline ? "var(--bg-surface-elevated)" : "var(--warning-dim)",
        border: `1px solid ${isOnline ? "var(--border-default)" : "rgba(245, 158, 11, 0.4)"}`,
        fontSize: "0.75rem",
        fontWeight: 600,
        color: isOnline ? "var(--text-secondary)" : "var(--warning)",
        transition: "all 0.2s ease",
      }}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          backgroundColor: isOnline ? "var(--success)" : "var(--warning)",
          boxShadow: isOnline
            ? "0 0 6px rgba(16, 185, 129, 0.6)"
            : "0 0 6px rgba(245, 158, 11, 0.8)",
          animation: isOnline ? "none" : "pulseSubtle 1.5s infinite",
        }}
      />
      <span>{isOnline ? "Conectado" : "Modo Offline (Local)"}</span>
    </div>
  );
};
