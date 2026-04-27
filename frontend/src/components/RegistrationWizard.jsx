import { useEffect, useMemo, useState } from "react";
import { Button, Card, Col, Form, Row } from "react-bootstrap";
import { Link } from "react-router-dom";
import { loginWithEmailCode, registerUser, requestEmailCode, verifyEmailCode } from "../api";

const STATE_KEY = "vpn_registration_state";
const RESEND_KEY = "vpn_registration_resend";
const COOLDOWN_MS = 60_000;

function loadState() {
  try {
    const raw = sessionStorage.getItem(STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return {
      step: Number(parsed.step) || 1,
      email: typeof parsed.email === "string" ? parsed.email : "",
      firstName: typeof parsed.firstName === "string" ? parsed.firstName : "",
      lastName: typeof parsed.lastName === "string" ? parsed.lastName : "",
      consentAccepted: Boolean(parsed.consentAccepted)
    };
  } catch {
    return null;
  }
}

export default function RegistrationWizard({ notify, onSuccess, onStepChange }) {
  const saved = loadState();
  const [step, setStep] = useState(saved?.step || 1);
  const [email, setEmail] = useState(saved?.email || "");
  const [code, setCode] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [firstName, setFirstName] = useState(saved?.firstName || "");
  const [lastName, setLastName] = useState(saved?.lastName || "");
  const [consentAccepted, setConsentAccepted] = useState(Boolean(saved?.consentAccepted));
  const [nowTs, setNowTs] = useState(Date.now());
  const [resendAvailableAt, setResendAvailableAt] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(RESEND_KEY) || "{}");
      return Number(raw.availableAt || 0);
    } catch {
      return 0;
    }
  });
  const [isRequestingCode, setIsRequestingCode] = useState(false);

  const emailIsValid = useMemo(() => /^\S+@\S+\.\S+$/.test(email), [email]);
  const canRegister = useMemo(() => Boolean(email && inviteCode && firstName), [email, inviteCode, firstName]);
  const resendSecondsLeft = Math.max(0, Math.ceil((resendAvailableAt - nowTs) / 1000));

  useEffect(() => {
    sessionStorage.setItem(STATE_KEY, JSON.stringify({ step, email, firstName, lastName, consentAccepted }));
    onStepChange(step);
  }, [step, email, firstName, lastName, consentAccepted, onStepChange]);

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
    if (isRequestingCode) return;
    setIsRequestingCode(true);
    try {
      await requestEmailCode(email);
      notify("success", "Код подтверждения отправлен на почту.");
      startCooldown(email);
      setStep(2);
    } catch (err) {
      notify("danger", err.message);
    } finally {
      setIsRequestingCode(false);
    }
  };

  const handleVerifyCode = async (event) => {
    event.preventDefault();
    try {
      const result = await verifyEmailCode(email, code);
      if (result?.flow === "login") {
        sessionStorage.removeItem(STATE_KEY);
        localStorage.removeItem(RESEND_KEY);
        setStep(1);
        setCode("");
        setInviteCode("");
        setFirstName("");
        setLastName("");
        notify("success", "Вход выполнен. Данные подключения восстановлены.");
        onSuccess({ flow: "login" });
        return;
      }
      notify("success", "Почта подтверждена.");
      setStep(3);
    } catch (err) {
      if (err?.message === "User already exists") {
        try {
          await loginWithEmailCode(email, code);
          sessionStorage.removeItem(STATE_KEY);
          localStorage.removeItem(RESEND_KEY);
          setStep(1);
          setCode("");
          setInviteCode("");
          setFirstName("");
          setLastName("");
          notify("success", "Вход выполнен. Данные подключения восстановлены.");
          onSuccess({ flow: "login" });
          return;
        } catch (loginErr) {
          notify("danger", loginErr.message);
          return;
        }
      }
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
      sessionStorage.removeItem(STATE_KEY);
      localStorage.removeItem(RESEND_KEY);
      setStep(1);
      setCode("");
      setInviteCode("");
      setFirstName("");
      setLastName("");
      onSuccess({ ...result, flow: "registration" });
    } catch (err) {
      notify("danger", err.message);
    }
  };

  return (
    <Card>
      <Card.Body>
        <Card.Title>Вход или регистрация в VPN</Card.Title>
        {step === 1 && (
          <Form onSubmit={handleRequestCode}>
            <Form.Group>
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@mail.com"
                required
              />
            </Form.Group>
            <Form.Group className="mt-3">
              <Form.Check
                id="consent-accepted"
                type="checkbox"
                checked={consentAccepted}
                onChange={(e) => setConsentAccepted(e.target.checked)}
                label={
                  <span>
                    Я согласен(на) на обработку персональных данных.{" "}
                    <Link to="/consent" target="_blank" rel="noreferrer">
                      Подробнее
                    </Link>
                  </span>
                }
              />
            </Form.Group>
            <div className="mt-3">
              <Button type="submit" disabled={isRequestingCode || !emailIsValid || !consentAccepted || resendSecondsLeft > 0}>
                {isRequestingCode
                  ? "Отправка..."
                  : resendSecondsLeft > 0
                    ? `Отправить код через ${resendSecondsLeft}с`
                    : "Отправить код"}
              </Button>
            </div>
          </Form>
        )}

        {step === 2 && (
          <Form onSubmit={handleVerifyCode}>
            <Form.Group>
              <Form.Label>Код подтверждения из письма</Form.Label>
              <Form.Control
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Например: 123456"
                required
              />
            </Form.Group>
            <div className="d-flex flex-column flex-md-row gap-2 mt-3">
              <Button className="w-100 w-md-auto" variant="outline-secondary" type="button" onClick={() => setStep(1)}>
                Изменить email
              </Button>
              <Button
                className="w-100 w-md-auto"
                type="button"
                variant="outline-primary"
                onClick={handleRequestCode}
                disabled={isRequestingCode || resendSecondsLeft > 0}
              >
                {isRequestingCode
                  ? "Отправка..."
                  : resendSecondsLeft > 0
                    ? `Отправить код заново через ${resendSecondsLeft}с`
                    : "Отправить код заново"}
              </Button>
              <Button className="w-100 w-md-auto" type="submit">Подтвердить код</Button>
            </div>
          </Form>
        )}

        {step === 3 && (
          <Form onSubmit={handleRegister}>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Имя</Form.Label>
                  <Form.Control
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Например: Иван"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Фамилия (необязательно)</Form.Label>
                  <Form.Control
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Например: Иванов"
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Код регистрации (одноразовый)</Form.Label>
                  <Form.Control
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Вставьте invite-код от администратора"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <div className="d-flex flex-column flex-md-row gap-2 mt-3">
              <Button className="w-100 w-md-auto" variant="outline-secondary" type="button" onClick={() => setStep(2)}>
                Назад к коду
              </Button>
              <Button className="w-100 w-md-auto" type="submit" disabled={!canRegister}>Завершить регистрацию</Button>
            </div>
          </Form>
        )}
      </Card.Body>
    </Card>
  );
}
