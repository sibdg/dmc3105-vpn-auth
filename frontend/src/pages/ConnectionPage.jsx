import { useEffect, useState } from "react";
import { Button, Card, Form, Table } from "react-bootstrap";
import GuideLinks from "../components/GuideLinks";

const CONNECTION_KEY = "vpn_connection_data";

export default function ConnectionPage({ notify }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(CONNECTION_KEY) || "null");
      setData(parsed);
    } catch {
      setData(null);
    }
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

  const buildHiddifyConfig = (connectionData) => {
    const server = String(connectionData?.server || "").trim();
    const username = String(connectionData?.username || "").trim();
    const password = String(connectionData?.password || "").trim();
    const { host, port } = parseServerEndpoint(server);
    const payload = {
      outbounds: [
        {
          type: "hysteria2",
          tag: "Hysteria 2",
          server: host || server,
          server_port: port,
          password: `${username}:${password}`,
          tls: {
            enabled: true,
            server_name: host || server
          }
        }
      ]
    };
    return JSON.stringify(payload, null, 2);
  };

  const buildHysteriaUri = (connectionData) => {
    const server = String(connectionData?.server || "").trim();
    const username = String(connectionData?.username || "").trim();
    const password = String(connectionData?.password || "").trim();
    const { host, port } = parseServerEndpoint(server);
    const auth = encodeURIComponent(`${username}:${password}`);
    const sni = encodeURIComponent(host || server);
    return `hysteria2://${auth}@${host || server}:${port}?sni=${sni}#VPN%20Auth`;
  };

  return (
    <Card>
      <Card.Body>
        <Card.Title>Данные подключения</Card.Title>
        {!data ? (
          <p className="mb-0">Нет данных подключения. Заверши регистрацию.</p>
        ) : (
          <div className="d-flex flex-column gap-3">
            <div className="table-responsive">
              <Table bordered className="align-middle mb-0">
                <thead>
                  <tr>
                    <th>Параметр</th>
                    <th>Значение</th>
                    <th>Действие</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Сервер</td>
                    <td>{data.server}</td>
                    <td>
                      <Button size="sm" variant="outline-primary" onClick={() => copy(data.server, "Сервер")} title="Копировать сервер">
                        <i className="bi bi-copy" />
                      </Button>
                    </td>
                  </tr>
                  <tr>
                    <td>Логин</td>
                    <td>{data.username}</td>
                    <td>
                      <Button size="sm" variant="outline-primary" onClick={() => copy(data.username, "Логин")} title="Копировать логин">
                        <i className="bi bi-copy" />
                      </Button>
                    </td>
                  </tr>
                  <tr>
                    <td>Пароль</td>
                    <td>{data.password}</td>
                    <td>
                      <Button size="sm" variant="outline-primary" onClick={() => copy(data.password, "Пароль")} title="Копировать пароль">
                        <i className="bi bi-copy" />
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </Table>
            </div>

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
                rows={2}
                readOnly
                value={buildHysteriaUri(data)}
                style={{ fontFamily: "monospace" }}
              />
            </div>

            <div>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <strong>Готовый JSON-конфиг (Hiddify/sing-box)</strong>
                <Button size="sm" variant="outline-success" onClick={() => copy(buildHiddifyConfig(data), "JSON-конфиг")}>
                  <i className="bi bi-copy me-1" />
                  Скопировать конфиг
                </Button>
              </div>
              <Form.Control
                as="textarea"
                rows={12}
                readOnly
                value={buildHiddifyConfig(data)}
                style={{ fontFamily: "monospace" }}
              />
            </div>
            <div>
              <strong>Гайды по подключению</strong>
              <GuideLinks />
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
