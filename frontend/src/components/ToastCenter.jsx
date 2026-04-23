import { Toast, ToastContainer } from "react-bootstrap";

export default function ToastCenter({ toasts, onClose }) {
  return (
    <ToastContainer
      position="top-end"
      className="p-3"
      style={{ position: "fixed", top: 0, right: 0, zIndex: 2000 }}
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          bg={toast.variant}
          autohide={toast.autohide}
          delay={5000}
          onClose={() => onClose(toast.id)}
        >
          <Toast.Header closeButton>
            <strong className="me-auto">Уведомление</strong>
          </Toast.Header>
          <Toast.Body className={toast.variant === "warning" ? "text-dark" : "text-white"}>{toast.message}</Toast.Body>
        </Toast>
      ))}
    </ToastContainer>
  );
}
