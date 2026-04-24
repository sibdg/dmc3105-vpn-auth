import { useEffect, useMemo, useState } from "react";
import { Button, Card, Form } from "react-bootstrap";
import { deleteProfile, requestDeleteCode } from "../api";

const RESEND_KEY = "vpn_delete_resend";
const COOLDOWN_MS = 60_000;

export default function DeleteProfileCard({ notify }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [nowTs, setNowTs] = useState(Date.now());
  const [resendAvailableAt, setResendAvailableAt] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(RESEND_KEY) || "{}");
      return Number(raw.availableAt || 0);
    } catch {
      return 0;
    }
  });
  const [isRequestingDeleteCode, setIsRequestingDeleteCode] = useState(false);

  const emailIsValid = useMemo(() => /^\S+@\S+\.\S+$/.test(email), [email]);
  const resendSecondsLeft = Math.max(0, Math.ceil((resendAvailableAt - nowTs) / 1000));

  useEffect(() => {
    const timer = window.setInterval(() => setNowTs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const startCooldown = () => {
    const availableAt = Date.now() + COOLDOWN_MS;
    setResendAvailableAt(availableAt);
    localStorage.setItem(RESEND_KEY, JSON.stringify({ availableAt }));
  };

  const handleRequestDeleteCode = async (event) => {
    event.preventDefault();
    if (isRequestingDeleteCode) return;
    setIsRequestingDeleteCode(true);
    try {
      await requestDeleteCode(email);
      notify("success", "Код удаления отправлен на почту.");
      startCooldown();
    } catch (err) {
      notify("danger", err.message);
    } finally {
      setIsRequestingDeleteCode(false);
    }
  };

  const handleDelete = async (event) => {
    event.preventDefault();
    try {
      await deleteProfile(email, code);
      notify("success", "Профиль удален.");
      setCode("");
    } catch (err) {
      notify("danger", err.message);
    }
  };

  return (
    <Card>
      <Card.Body>
        <Card.Title>Удалить профиль</Card.Title>
        <Form onSubmit={handleDelete}>
          <Form.Group className="mb-3">
            <Form.Label>Email аккаунта</Form.Label>
            <Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Form.Group>
          <div className="mb-3">
            <Button
              type="button"
              variant="outline-danger"
              onClick={handleRequestDeleteCode}
              disabled={isRequestingDeleteCode || !emailIsValid || resendSecondsLeft > 0}
            >
              {isRequestingDeleteCode
                ? "Отправка..."
                : resendSecondsLeft > 0
                  ? `Отправить код через ${resendSecondsLeft}с`
                  : "Отправить код удаления"}
            </Button>
          </div>
          <Form.Group className="mb-3">
            <Form.Label>Код подтверждения удаления</Form.Label>
            <Form.Control value={code} onChange={(e) => setCode(e.target.value)} required />
          </Form.Group>
          <Button variant="danger" type="submit">Удалить профиль</Button>
        </Form>
      </Card.Body>
    </Card>
  );
}
