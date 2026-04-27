import { useEffect, useState } from "react";
import { Button, Card, Form } from "react-bootstrap";
import { QRCodeCanvas } from "qrcode.react";
import { getProfileConnection } from "../api";
import GuidesAccordion from "../components/GuidesAccordion";

const HYSTERIA_URI_TAG = import.meta.env.VITE_HYSTERIA_URI_TAG || "VPN Auth";

function normalizeConnectionData(raw) {
  if (!raw || typeof raw !== "object") return null;
  return {
    ...raw,
    username: raw.vpn_username || raw.username || ""
  };
}

export default function ConnectionPage({ notify }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadConnectionData = async () => {
      try {
        const payload = await getProfileConnection();
        setData(normalizeConnectionData(payload));
      } catch {
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };
    void loadConnectionData();
  }, []);

  const copy = async (value, label) => {
    await navigator.clipboard.writeText(String(value));
    if (notify) {
      notify("success", `${label} скопировано`);
    }
  };

  const parseServerEndpoint = (rawServer) => {
    const input = String(rawServer || "").trim();
    if (!input) return { host: "", port: 443 };

    // Supports values like:
    // hs2.example.com:443
    // https://hs2.example.com:443
    // hs2.example.com
    const withScheme = input.includes("://") ? input : `https://${input}`;
    try {
      const url = new URL(withScheme);
      return {
        host: url.hostname,
        port: Number(url.port) || 443
      };
    } catch {
      const cleaned = input.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
      const [host, portRaw] = cleaned.split(":");
      return { host: host || cleaned, port: Number(portRaw) || 443 };
    }
  };

  const buildHysteriaUri = (connectionData) => {
    const server = String(connectionData?.server || "").trim();
    const username = String(connectionData?.username || "").trim();
    const password = String(connectionData?.password || "").trim();
    const { host, port } = parseServerEndpoint(server);
    const auth = encodeURIComponent(`${username}:${password}`);
    const sni = encodeURIComponent(host || server);
    const tag = encodeURIComponent(HYSTERIA_URI_TAG);
    return `hysteria2://${auth}@${host || server}:${port}?sni=${sni}#${tag}`;
  };

  return (
    <div className="d-flex flex-column gap-3">
      <Card>
        <Card.Body>
          <Card.Title>Данные подключения</Card.Title>
          {isLoading ? (
            <p className="mb-0">Загружаем данные подключения...</p>
          ) : !data ? (
            <p className="mb-0">Нет данных подключения или сессия истекла. Выполни вход или регистрацию снова.</p>
          ) : (
            <div className="d-flex flex-column gap-3">
              <div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <strong>URI для импорта в Hiddify</strong>
                  <Button size="sm" variant="outline-primary" onClick={() => copy(buildHysteriaUri(data), "Hysteria URI")}>
                    <i className="bi bi-copy me-1" />
                    Скопировать URI
                  </Button>
                </div>
                <Form.Control
                  as="textarea"
                  rows={5}
                  readOnly
                  value={buildHysteriaUri(data)}
                  style={{ fontFamily: "monospace" }}
                />
              </div>
              <div className="d-flex flex-column align-items-center">
                <strong className="mb-2">QR для быстрого подключения</strong>
                <QRCodeCanvas value={buildHysteriaUri(data)} size={220} includeMargin />
              </div>
            </div>
          )}
        </Card.Body>
      </Card>
      <GuidesAccordion />
    </div>
  );
}
