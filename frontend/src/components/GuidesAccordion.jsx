import { Accordion, Card } from "react-bootstrap";

const GUIDE_DATA = [
  {
    key: "android",
    title: "Android",
    links: [
      {
        label: "Общая ссылка (может не работать без прокси)",
        url: "https://hiddify.com/"
      },
      {
        label: "GitHub Releases",
        url: "https://github.com/hiddify/hiddify-app/releases/"
      },
      {
        label: "Android (Google Play)",
        url: "https://play.google.com/store/apps/details?id=app.hiddify.com"
      }
    ],
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
    links: [
      {
        label: "Egern (App Store, работает в RU-регионе)",
        url: "https://apps.apple.com/ru/app/egern/id1616105820"
      },
      {
        label: "Hiddify (App Store, в RU-регионе обычно недоступен/не работает)",
        url: "https://apps.apple.com/us/app/hiddify-proxy-vpn/id6596777532"
      },
      {
        label: "Hiddify (официальный сайт, может не открываться без прокси)",
        url: "https://hiddify.com/"
      }
    ],
    steps: [
      "Рекомендуемый вариант для РФ-региона: установи Egern из App Store.",
      "Hiddify оставлен как пример клиента, но в RU-регионе может быть недоступен или работать нестабильно.",
      "Добавь профиль через ссылку или QR.",
      "Нажми Connect и подтверди VPN-конфигурацию.",
      "Проверь статус Connected."
    ]
  },
  {
    key: "windows",
    title: "Windows",
    links: [
      {
        label: "Общая ссылка (может не работать без прокси)",
        url: "https://hiddify.com/"
      },
      {
        label: "GitHub Releases",
        url: "https://github.com/hiddify/hiddify-app/releases/"
      }
    ],
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
    links: [
      {
        label: "Общая ссылка (может не работать без прокси)",
        url: "https://hiddify.com/"
      },
      {
        label: "GitHub Releases",
        url: "https://github.com/hiddify/hiddify-app/releases/"
      }
    ],
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
    links: [
      {
        label: "Общая ссылка (может не работать без прокси)",
        url: "https://hiddify.com/"
      },
      {
        label: "GitHub Releases",
        url: "https://github.com/hiddify/hiddify-app/releases/"
      }
    ],
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
        <Accordion alwaysOpen>
          {GUIDE_DATA.map((guide) => (
            <Accordion.Item eventKey={guide.key} key={guide.key}>
              <Accordion.Header>{guide.title}</Accordion.Header>
              <Accordion.Body>
                <p className="mb-2">
                  Ссылки для скачивания:
                </p>
                <ul>
                  {guide.links.map((link) => (
                    <li key={`${guide.key}-${link.url}`}>
                      {link.label}:{" "}
                      <a href={link.url} target="_blank" rel="noreferrer">
                        {link.url}
                      </a>
                    </li>
                  ))}
                </ul>
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
