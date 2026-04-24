import { Accordion, Card } from "react-bootstrap";

const GUIDE_DATA = [
  {
    key: "android",
    title: "Android",
    steps: [
      "Установи Hiddify из Google Play или APK с официального сайта.",
      "Нажми Add profile и импортируй ссылку или QR.",
      "Нажми Connect и разреши VPN в системе.",
      "Проверь статус Connected."
    ]
  },
  {
    key: "ios",
    title: "iOS",
    steps: [
      "Установи Hiddify из App Store.",
      "Добавь профиль через ссылку или QR.",
      "Нажми Connect и подтверди VPN-конфигурацию.",
      "Проверь статус Connected."
    ]
  },
  {
    key: "windows",
    title: "Windows",
    steps: [
      "Скачай и установи Hiddify для Windows.",
      "Импортируй профиль по ссылке или QR.",
      "Нажми Connect.",
      "Проверь, что трафик идет через VPN."
    ]
  },
  {
    key: "macos",
    title: "macOS",
    steps: [
      "Установи Hiddify для macOS.",
      "Добавь профиль через URL или QR.",
      "Нажми Connect и выдай разрешения.",
      "Проверь подключение."
    ]
  },
  {
    key: "linux",
    title: "Linux",
    steps: [
      "Скачай сборку Hiddify для дистрибутива.",
      "Установи и запусти клиент.",
      "Импортируй профиль из URL или QR.",
      "Нажми Connect и проверь внешний IP."
    ]
  }
];

export default function GuidesAccordion() {
  return (
    <Card>
      <Card.Body>
        <Card.Title>Гайды по подключению</Card.Title>
        <p>
          Скачать клиент:{" "}
          <a href="https://hiddify.com/app/" target="_blank" rel="noreferrer">
            https://hiddify.com/app/
          </a>
        </p>
        <Accordion alwaysOpen>
          {GUIDE_DATA.map((guide) => (
            <Accordion.Item eventKey={guide.key} key={guide.key}>
              <Accordion.Header>{guide.title}</Accordion.Header>
              <Accordion.Body>
                <ol className="mb-0">
                  {guide.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>
      </Card.Body>
    </Card>
  );
}
