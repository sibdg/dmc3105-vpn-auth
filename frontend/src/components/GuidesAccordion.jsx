import { useRef, useState } from "react";
import { Accordion, Button, Card } from "react-bootstrap";

const GUIDE_DATA = [
  {
    key: "android",
    title: "Android",
    links: [
      {
        label: "Google Play",
        url: "https://play.google.com/store/apps/details?id=app.hiddify.com"
      },
      {
        label: "официального сайта Hiddify",
        url: "https://hiddify.com/",
        note: "Может быть недоступно из РФ при российском IP."
      },
      {
        label: "GitHub Releases",
        url: "https://github.com/hiddify/hiddify-app/releases/"
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
        label: "App Store",
        client: "Egern",
        url: "https://apps.apple.com/ru/app/egern/id1616105820"
      },
      {
        label: "App Store",
        client: "Hiddify",
        url: "https://apps.apple.com/us/app/hiddify-proxy-vpn/id6596777532",
        note: "В RU-регионе обычно недоступен или работает нестабильно."
      },
      {
        label: "официального сайта Hiddify",
        url: "https://hiddify.com/",
        note: "Может быть недоступно из РФ при российском IP."
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
        label: "GitHub Releases",
        url: "https://github.com/hiddify/hiddify-app/releases/"
      },
      {
        label: "официального сайта Hiddify",
        url: "https://hiddify.com/",
        note: "Может быть недоступно из РФ при российском IP."
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
        label: "App Store",
        client: "Egern",
        url: "https://apps.apple.com/ru/app/egern/id1616105820"
      },
      {
        label: "GitHub Releases",
        url: "https://github.com/hiddify/hiddify-app/releases/"
      },
      {
        label: "официального сайта Hiddify",
        url: "https://hiddify.com/",
        note: "Может быть недоступно из РФ при российском IP."
      }
    ],
    steps: [
      "Для macOS актуально то же самое, что и для iOS: в RU-регионе можно использовать Egern как рабочий вариант.",
      "Hiddify оставлен как пример клиента, но в RU-регионе может быть недоступен или работать нестабильно.",
      "Установи выбранный клиент для macOS.",
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
        label: "GitHub Releases",
        url: "https://github.com/hiddify/hiddify-app/releases/"
      },
      {
        label: "официального сайта Hiddify",
        url: "https://hiddify.com/",
        note: "Может быть недоступно из РФ при российском IP."
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

function noteMarker(index) {
  return "✱".repeat(index + 1);
}

export default function GuidesAccordion() {
  const [activeKey, setActiveKey] = useState(null);
  const itemRefs = useRef({});

  const handleSelect = (eventKey) => {
    setActiveKey(eventKey);
    if (!eventKey) return;
    window.setTimeout(() => {
      const target = itemRefs.current[eventKey];
      const headerButton = target?.querySelector(".accordion-button");
      if (!headerButton) return;
      const top = Math.max(0, headerButton.getBoundingClientRect().top + window.scrollY);
      window.scrollTo({ top, behavior: "smooth" });
    }, 220);
  };

  return (
    <Card>
      <Card.Body>
        <Card.Title>Гайды по подключению</Card.Title>
        <Accordion activeKey={activeKey} onSelect={handleSelect}>
          {GUIDE_DATA.map((guide) => {
            const noteLinks = guide.links.filter((link) => Boolean(link.note));
            const noteMarkByUrl = new Map(noteLinks.map((link, idx) => [link.url, noteMarker(idx)]));
            return (
              <Accordion.Item
                eventKey={guide.key}
                key={guide.key}
                ref={(node) => {
                  if (node) itemRefs.current[guide.key] = node;
                }}
              >
                <Accordion.Header>{guide.title}</Accordion.Header>
                <Accordion.Body>
                  <ol className="mb-0">
                    {guide.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                  <p className="mt-3 mb-2">
                    Скачать клиент:
                  </p>
                  <div className="d-flex flex-column gap-2">
                    {guide.links.map((link, idx) => (
                      <Button
                        key={`${guide.key}-${link.url}`}
                        as="a"
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        variant={idx === 0 ? "primary" : "outline-secondary"}
                        size="sm"
                        className="w-100 text-start py-2 px-3"
                      >
                        {`Скачать с ${link.label}${link.client ? ` - ${link.client}` : ""}`}
                        {link.note ? <sup className="ms-1">{noteMarkByUrl.get(link.url)}</sup> : null}
                      </Button>
                    ))}
                  </div>
                  {noteLinks.length > 0 && (
                    <div className="mt-2">
                      <ul className="mb-0 small text-muted ps-3">
                        {noteLinks.map((link) => (
                          <li key={`${guide.key}-${link.url}-note`}>
                            {`${noteMarkByUrl.get(link.url)} ${link.note}`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Accordion.Body>
              </Accordion.Item>
            );
          })}
        </Accordion>
      </Card.Body>
    </Card>
  );
}
