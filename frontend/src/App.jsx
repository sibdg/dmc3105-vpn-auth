import { useState } from "react";
import { Button, Container } from "react-bootstrap";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import ToastCenter from "./components/ToastCenter";
import AdminPage from "./pages/AdminPage";
import ConnectionPage from "./pages/ConnectionPage";
import ConsentPage from "./pages/ConsentPage";
import DeleteProfilePage from "./pages/DeleteProfilePage";
import GuidePage from "./pages/GuidePage";
import RegistrationPage from "./pages/RegistrationPage";

const APP_NAME = import.meta.env.VITE_APP_NAME || "VPN Access Service";

function Navigation() {
  const { pathname } = useLocation();
  return (
    <div className="d-flex flex-column flex-md-row gap-2 mb-3">
      <Button as={Link} to="/" className="w-100 w-md-auto text-start text-md-center" variant={pathname === "/" ? "primary" : "outline-primary"}>
        Регистрация
      </Button>
      <Button
        as={Link}
        to="/connection"
        className="w-100 w-md-auto text-start text-md-center"
        variant={pathname === "/connection" ? "success" : "outline-success"}
      >
        Данные подключения
      </Button>
      <Button
        as={Link}
        to="/guides"
        className="w-100 w-md-auto text-start text-md-center"
        variant="danger"
      >
        С чего начать?
      </Button>
      <Button
        as={Link}
        to="/delete-profile"
        className="w-100 w-md-auto text-start text-md-center"
        variant={pathname === "/delete-profile" ? "danger" : "outline-danger"}
      >
        Удалить профиль
      </Button>
      <Button
        as={Link}
        to="/consent"
        className="w-100 w-md-auto text-start text-md-center"
        variant={pathname === "/consent" ? "secondary" : "outline-secondary"}
      >
        Согласие
      </Button>
    </div>
  );
}

export default function App() {
  const [toasts, setToasts] = useState([]);

  const notify = (variant, message, autohide = true) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, variant, message, autohide }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <>
      <Container className="py-4">
        <h1 className="mb-4">{APP_NAME}</h1>
        <Navigation />
        <Routes>
          <Route path="/" element={<RegistrationPage notify={notify} />} />
          <Route path="/connection" element={<ConnectionPage notify={notify} />} />
          <Route path="/delete-profile" element={<DeleteProfilePage notify={notify} />} />
          <Route path="/consent" element={<ConsentPage />} />
          <Route path="/guides" element={<GuidePage />} />
          <Route path="/guides/:os" element={<Navigate to="/guides" replace />} />
          <Route path="/admin/*" element={<AdminPage notify={notify} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Container>
      <ToastCenter toasts={toasts} onClose={removeToast} />
    </>
  );
}
