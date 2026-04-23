import { useEffect, useState } from "react";
import { Button, Card, Col, Form, Row } from "react-bootstrap";
import { adminLogin, adminLogout, adminSession } from "../api";

export default function AdminAuthGate({ notify, children }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [checked, setChecked] = useState(false);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");

  useEffect(() => {
    adminSession()
      .then(() => setAuthenticated(true))
      .catch(() => setAuthenticated(false))
      .finally(() => setChecked(true));
  }, []);

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      await adminLogin(username, password);
      setAuthenticated(true);
      notify("success", "Вход в админку выполнен.");
    } catch (err) {
      notify("danger", err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await adminLogout();
    } finally {
      setAuthenticated(false);
    }
  };

  if (!checked || !authenticated) {
    return (
      <Card>
        <Card.Body>
          <Card.Title>Вход в админку</Card.Title>
          <Form onSubmit={handleLogin}>
            <Row className="g-3">
              <Col md={4}>
                <Form.Control value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Логин" />
              </Col>
              <Col md={4}>
                <Form.Control
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Пароль"
                  required
                />
              </Col>
              <Col md={4}>
                <Button type="submit">Войти</Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>
    );
  }

  return children(handleLogout);
}
