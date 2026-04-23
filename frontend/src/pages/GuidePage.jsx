import { Card } from "react-bootstrap";
import { useParams } from "react-router-dom";

const GUIDE_DATA = {
  android: {
    title: "Android",
    steps: [
      "Установи Hiddify из Google Play или APK с официального сайта.",
      "Нажми Add profile и импортируй ссылку/QR.",
      "Нажми Connect и разреши VPN в системе.",
      "Проверь статус Connected."
    ]
  },
  ios: {
    title: "iOS",
    steps: [
      "Установи Hiddify из App Store.",
      "Добавь профиль через ссылку или QR.",
      "Нажми Connect и подтверди VPN-конфигурацию.",
      "Проверь статус Connected."
    ]
  },
  windows: {
    title: "Windows",
    steps: [
      "Скачай и установи Hiddify для Windows.",
      "Импортируй профиль по ссылке/QR.",
      "Нажми Connect.",
      "Проверь, что трафик идет через VPN."
    ]
  },
  macos: {
    title: "macOS",
    steps: [
      "Установи Hiddify для macOS.",
      "Добавь профиль через URL или QR.",
      "Нажми Connect и выдай разрешения.",
      "Проверь подключение."
    ]
  },
  linux: {
    title: "Linux",
    steps: [
      "Скачай сборку Hiddify для дистрибутива.",
      "Установи и запусти клиент.",
      "Импортируй профиль из URL/QR.",
      "Нажми Connect и проверь внешний IP."
    ]
  }
};

export default function GuidePage() {
  const { os = "" } = useParams();
  const guide = GUIDE_DATA[os.toLowerCase()];

  if (!guide) {
    return (
      <Card>
        <Card.Body>
          <Card.Title>Гайд не найден</Card.Title>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Body>
        <Card.Title>Hiddify: {guide.title}</Card.Title>
        <p>
          Скачать клиент: <a href="https://hiddify.com/app/" target="_blank" rel="noreferrer">https://hiddify.com/app/</a>
        </p>
        <ol className="mb-0">
          {guide.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </Card.Body>
    </Card>
  );
}
