import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "./Button";

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("GymApp ErrorBoundary caught an unhandled exception:", error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100dvh",
            padding: "24px 20px",
            backgroundColor: "var(--bg-primary)",
            color: "var(--text-primary)",
            textAlign: "center",
            gap: "18px",
            maxWidth: "440px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              backgroundColor: "var(--danger-dim)",
              border: "1px solid var(--danger)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.75rem",
            }}
          >
            ⚠️
          </div>

          <div>
            <h1 style={{ fontSize: "1.375rem", margin: "0 0 6px 0" }}>
              Algo salió mal
            </h1>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Ocurrió un error inesperado en la interfaz. No te preocupes: tus series y datos locales en IndexedDB están a salvo.
            </p>
          </div>

          {this.state.error?.message ? (
            <div
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                textAlign: "left",
                maxHeight: "100px",
                overflowY: "auto",
              }}
            >
              {this.state.error.message}
            </div>
          ) : null}

          <div style={{ display: "flex", gap: "10px", width: "100%", marginTop: "8px" }}>
            <Button
              variant="secondary"
              size="md"
              style={{ flex: 1 }}
              onClick={this.handleReset}
            >
              Reintentar
            </Button>
            <Button
              variant="primary"
              size="md"
              style={{ flex: 1.2 }}
              onClick={this.handleReload}
            >
              Recargar App
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
