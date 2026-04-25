import { useEffect, useState } from "react";
import { Button, Collapse, Container } from "react-bootstrap";
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
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="mb-3">
      <div className="d-none d-md-flex flex-row gap-2">
        <Button as={Link} to="/guides" variant={pathname.startsWith("/guides") ? "primary" : "outline-primary"}>
          С чего начать?
        </Button>
        <Button as={Link} to="/" variant={pathname === "/" ? "primary" : "outline-primary"}>
          Регистрация
        </Button>
        <Button as={Link} to="/connection" variant={pathname === "/connection" ? "success" : "outline-success"}>
          Данные подключения
        </Button>
        <Button as={Link} to="/delete-profile" variant={pathname === "/delete-profile" ? "danger" : "outline-danger"}>
          Удалить профиль
        </Button>
        <Button as={Link} to="/consent" variant={pathname === "/consent" ? "secondary" : "outline-secondary"}>
          Согласие
        </Button>
      </div>

      <div className="d-md-none d-flex flex-column align-items-stretch gap-2">
        <div className="d-flex flex-column align-items-stretch gap-2">
          <Collapse in={isOpen}>
            <div id="main-nav-collapse">
              <div className="d-flex flex-column gap-2">
                <Button as={Link} to="/guides" variant={pathname.startsWith("/guides") ? "primary" : "outline-primary"}>
                  С чего начать?
                </Button>
                <Button as={Link} to="/" variant={pathname === "/" ? "primary" : "outline-primary"}>
                  Регистрация
                </Button>
                <Button as={Link} to="/connection" variant={pathname === "/connection" ? "success" : "outline-success"}>
                  Данные подключения
                </Button>
                <Button as={Link} to="/delete-profile" variant={pathname === "/delete-profile" ? "danger" : "outline-danger"}>
                  Удалить профиль
                </Button>
                <Button as={Link} to="/consent" variant={pathname === "/consent" ? "secondary" : "outline-secondary"}>
                  Согласие
                </Button>
              </div>
            </div>
          </Collapse>
        </div>
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls="main-nav-collapse"
          onClick={() => setIsOpen((prev) => !prev)}
          title={isOpen ? "Свернуть меню" : "Развернуть меню"}
          style={{
            marginTop: "4px",
            padding: "20px 0px",
            border: "none",
            background: "transparent",
            height: "22px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            userSelect: "none"
          }}
        >
          <svg
            width="28"
            height="14"
            viewBox="0 0 28 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease"
            }}
          >
            <polyline points="2,4 14,10 26,4" stroke="#6c757d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    document.title = APP_NAME;
  }, []);

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
