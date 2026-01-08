// src/components/ToastProvider.jsx
import { Toaster } from 'sonner'

export default () => {
  return (
    <Toaster
      position="top-center"
      closeButton
      toastOptions={{
        duration: 3000,
        style: {
          width: "clamp(300px, max-content, 400px)",
          maxWidth: "90vw",
          padding: "0.9rem 1rem",
          borderRadius: "14px",
          background: "rgba(255,255,255,0)",
          color: "#111",
          fontSize: "17px",
          boxShadow: "0 8px 25px rgba(0,0,0,0.25)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.18)",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        },
        success: {
          style: {
            width: "clamp(300px, max-content, 400px)",
            borderRadius: "14px",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0)",
            background: "rgba(16,185,129,0.14)",
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          },
        },
        error: {
          style: {
            width: "clamp(300px, max-content, 400px)",
            borderRadius: "14px",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0)",
            background: "rgba(244,63,94,0.15)",
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          },
        },
      }}
    />
  )
}
