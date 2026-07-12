import { Component } from "react";

// Catches render/lifecycle errors in the page beneath a layout so a bug on
// one page doesn't take down the sidebar/nav shell around it. Must stay a
// class component — React only supports error boundaries via
// componentDidCatch/getDerivedStateFromError, no hook equivalent exists.
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Page crashed:", error, info.componentStack);
  }

  componentDidUpdate(prevProps) {
    // Clear the error when navigating to a different page so the boundary
    // doesn't keep showing a stale crash after the user moves on.
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: "12px", padding: "60px 24px", textAlign: "center", color: "var(--text)",
      }}>
        <div style={{ fontSize: "40px" }}>⚠️</div>
        <h3 style={{ margin: 0 }}>Something went wrong on this page</h3>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: "16px", maxWidth: "420px" }}>
          Try reloading — if the problem continues, please let us know what you were doing.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: "8px", padding: "10px 20px", borderRadius: "8px", border: "none",
            background: "var(--green-primary)", color: "#fff", fontWeight: 600, cursor: "pointer",
          }}
        >
          Reload page
        </button>
      </div>
    );
  }
}
