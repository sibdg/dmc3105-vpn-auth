import { useEffect, useState } from "react";
import { Button, Collapse, Container } from "react-bootstrap";
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { userLogout, userSession } from "./api";
import ToastCenter from "./components/ToastCenter";
import AdminPage from "./pages/AdminPage";
import ConnectionPage from "./pages/ConnectionPage";
import ConsentPage from "./pages/ConsentPage";
import DeleteProfilePage from "./pages/DeleteProfilePage";
import GuidePage from "./pages/GuidePage";
import RegistrationPage from "./pages/RegistrationPage";

const APP_NAME = import.meta.env.VITE_APP_NAME || "VPN Access Service";

function Navigation({ notify }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [isUserLoggingOut, setIsUserLoggingOut] = useState(false);
  const [isOpen, setIsOpen] = useState(() => {
    try {
      const saved = localStorage.getItem("mobileNavIsOpen");
      return saved === null ? true : saved === "true";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("mobileNavIsOpen", String(isOpen));
    } catch {
      // Ignore storage errors (private mode or restricted settings).
    }
  }, [isOpen]);

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        await userSession();
        setIsUserLoggedIn(true);
      } catch {
        setIsUserLoggedIn(false);
      }
    };
    void checkUserSession();
  }, [pathname]);

  const closeMobileMenu = () => setIsOpen(false);

  const handleUserLogout = async () => {
    if (isUserLoggingOut) return;
    setIsUserLoggingOut(true);
    try {
      await userLogout();
      setIsUserLoggedIn(false);
      notify("success", "Вы вышли из аккаунта.");
      navigate("/", { replace: true });
    } catch (err) {
      notify("danger", err.message);
    } finally {
      setIsUserLoggingOut(false);
    }
  };

  return (
    <div>
      <div className="d-none d-md-flex flex-row gap-2">
        <Button as={Link} to="/guides" variant={pathname.startsWith("/guides") ? "primary" : "outline-primary"}>
          С чего начать?
        </Button>
        {isUserLoggedIn ? (
          <Button variant="outline-danger" onClick={handleUserLogout} disabled={isUserLoggingOut}>
            {isUserLoggingOut ? "Выходим..." : "Выйти"}
          </Button>
        ) : (
          <Button as={Link} to="/registration" variant={pathname === "/registration" ? "primary" : "outline-primary"}>
            Вход или регистрация
          </Button>
        )}
        {isUserLoggedIn && (
          <Button as={Link} to="/connection" variant={pathname === "/connection" ? "success" : "outline-success"}>
            Данные подключения
          </Button>
        )}
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
                <Button
                  as={Link}
                  to="/guides"
                  onClick={closeMobileMenu}
                  variant={pathname.startsWith("/guides") ? "primary" : "outline-primary"}
                >
                  С чего начать?
                </Button>
                {isUserLoggedIn ? (
                  <Button
                    variant="outline-danger"
                    onClick={() => {
                      closeMobileMenu();
                      void handleUserLogout();
                    }}
                    disabled={isUserLoggingOut}
                  >
                    {isUserLoggingOut ? "Выходим..." : "Выйти"}
                  </Button>
                ) : (
                  <Button
                    as={Link}
                    to="/registration"
                    onClick={closeMobileMenu}
                    variant={pathname === "/registration" ? "primary" : "outline-primary"}
                  >
                    Вход или регистрация
                  </Button>
                )}
                {isUserLoggedIn && (
                  <Button
                    as={Link}
                    to="/connection"
                    onClick={closeMobileMenu}
                    variant={pathname === "/connection" ? "success" : "outline-success"}
                  >
                    Данные подключения
                  </Button>
                )}
                <Button
                  as={Link}
                  to="/delete-profile"
                  onClick={closeMobileMenu}
                  variant={pathname === "/delete-profile" ? "danger" : "outline-danger"}
                >
                  Удалить профиль
                </Button>
                <Button
                  as={Link}
                  to="/consent"
                  onClick={closeMobileMenu}
                  variant={pathname === "/consent" ? "secondary" : "outline-secondary"}
                >
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
          className="text-body-secondary"
          style={{
            marginTop: "0px",
            padding: "4px 0px",
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
            <polyline points="2,4 14,10 26,4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function ProtectedConnectionRoute({ notify }) {
  const [isChecking, setIsChecking] = useState(true);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        await userSession();
        setIsUserLoggedIn(true);
      } catch {
        setIsUserLoggedIn(false);
      } finally {
        setIsChecking(false);
      }
    };
    void checkUserSession();
  }, []);

  if (isChecking) return null;
  if (!isUserLoggedIn) return <Navigate to="/guides" replace />;
  return <ConnectionPage notify={notify} />;
}

function RootRedirect() {
  const [isChecking, setIsChecking] = useState(true);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        await userSession();
        setIsUserLoggedIn(true);
      } catch {
        setIsUserLoggedIn(false);
      } finally {
        setIsChecking(false);
      }
    };
    void checkUserSession();
  }, []);

  if (isChecking) return null;
  return <Navigate to={isUserLoggedIn ? "/connection" : "/guides"} replace />;
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
      <div
        className="sticky-top bg-body border-bottom"
        style={{ zIndex: 1030 }}
      >
        <Container className="py-2 py-md-3">
          <h1 className="mb-2 mb-md-3 fs-4">{APP_NAME}</h1>
          <Navigation notify={notify} />
        </Container>
      </div>
      <Container className="py-4">
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/registration" element={<RegistrationPage notify={notify} />} />
          <Route path="/connection" element={<ProtectedConnectionRoute notify={notify} />} />
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
