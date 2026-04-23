import { useEffect, useMemo, useState } from "react";
import { Button, Card, Col, Form, Row } from "react-bootstrap";
import { registerUser, requestEmailCode, verifyEmailCode } from "../api";

const STATE_KEY = "vpn_registration_state";
const RESEND_KEY = "vpn_registration_resend";
const COOLDOWN_MS = 60_000;

function loadState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function RegistrationWizard({ notify, onSuccess, onStepChange }) {
  const saved = loadState();
  const [step, setStep] = useState(saved?.step || 1);
  const [email, setEmail] = useState(saved?.email || "");
  const [code, setCode] = useState(saved?.code || "");
  const [inviteCode, setInviteCode] = useState(saved?.inviteCode || "");
  const [firstName, setFirstName] = useState(saved?.firstName || "");
  const [lastName, setLastName] = useState(saved?.lastName || "");
  const [nowTs, setNowTs] = useState(Date.now());
  const [resendAvailableAt, setResendAvailableAt] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(RESEND_KEY) || "{}");
      return Number(raw.availableAt || 0);
    } catch {
      return 0;
    }
  });

  const emailIsValid = useMemo(() => /^\S+@\S+\.\S+$/.test(email), [email]);
  const canRegister = useMemo(() => Boolean(email && inviteCode && firstName), [email, inviteCode, firstName]);
  const resendSecondsLeft = Math.max(0, Math.ceil((resendAvailableAt - nowTs) / 1000));

  useEffect(() => {
    localStorage.setItem(STATE_KEY, JSON.stringify({ step, email, code, inviteCode, firstName, lastName }));
    onStepChange(step);
  }, [step, email, code, inviteCode, firstName, lastName, onStepChange]);

  useEffect(() => {
    const timer = window.setInterval(() => setNowTs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const startCooldown = (targetEmail) => {
    const availableAt = Date.now() + COOLDOWN_MS;
    setResendAvailableAt(availableAt);
    localStorage.setItem(RESEND_KEY, JSON.stringify({ availableAt, email: targetEmail }));
  };

  const handleRequestCode = async (event) => {
    event.preventDefault();
    try {
      await requestEmailCode(email);
      notify("success", "Код подтверждения отправлен на почту.");
      startCooldown(email);
      setStep(2);
    } catch (err) {
      notify("danger", err.message);
    }
  };

  const handleVerifyCode = async (event) => {
    event.preventDefault();
    try {
      await verifyEmailCode(email, code);
      notify("success", "Почта подтверждена.");
      setStep(3);
    } catch (err) {
      notify("danger", err.message);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    try {
      const result = await registerUser({
        email,
        invite_code: inviteCode,
        first_name: firstName,
        last_name: lastName || null
      });
      localStorage.removeItem(STATE_KEY);
      localStorage.removeItem(RESEND_KEY);
      setStep(1);
      setCode("");
      setInviteCode("");
      setFirstName("");
      setLastName("");
      onSuccess(result);
    } catch (err) {
      notify("danger", err.message);
    }
  };

  return (
    <Card>
      <Card.Body>
        <Card.Title>Регистрация в VPN</Card.Title>
        {step === 1 && (
          <Form onSubmit={handleRequestCode}>
            <Form.Group>
              <Form.Label>Email (будет логином)</Form.Label>
              <Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Form.Group>
            <div className="mt-3">
              <Button type="submit" disabled={!emailIsValid || resendSecondsLeft > 0}>
                {resendSecondsLeft > 0 ? `Отправить код через ${resendSecondsLeft}с` : "Отправить код"}
              </Button>
            </div>
          </Form>
        )}

        {step === 2 && (
          <Form onSubmit={handleVerifyCode}>
            <Form.Group>
              <Form.Label>Код подтверждения из письма</Form.Label>
              <Form.Control value={code} onChange={(e) => setCode(e.target.value)} required />
            </Form.Group>
            <div className="d-flex gap-2 mt-3">
              <Button variant="outline-secondary" type="button" onClick={() => setStep(1)}>
                Изменить email
              </Button>
              <Button type="button" variant="outline-primary" onClick={handleRequestCode} disabled={resendSecondsLeft > 0}>
                {resendSecondsLeft > 0 ? `Отправить код заново через ${resendSecondsLeft}с` : "Отправить код заново"}
              </Button>
              <Button type="submit">Подтвердить код</Button>
            </div>
          </Form>
        )}

        {step === 3 && (
          <Form onSubmit={handleRegister}>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Имя</Form.Label>
                  <Form.Control value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Фамилия (опционально)</Form.Label>
                  <Form.Control value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Код регистрации (одноразовый)</Form.Label>
                  <Form.Control value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} required />
                </Form.Group>
              </Col>
            </Row>
            <div className="d-flex gap-2 mt-3">
              <Button variant="outline-secondary" type="button" onClick={() => setStep(2)}>
                Назад к коду
              </Button>
              <Button type="submit" disabled={!canRegister}>Завершить регистрацию</Button>
            </div>
          </Form>
        )}
      </Card.Body>
    </Card>
  );
}
