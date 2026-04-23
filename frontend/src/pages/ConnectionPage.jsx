import { useEffect, useState } from "react";
import { Button, Card, Table } from "react-bootstrap";

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

  return (
    <Card>
      <Card.Body>
        <Card.Title>Данные подключения</Card.Title>
        {!data ? (
          <p className="mb-0">Нет данных подключения. Заверши регистрацию.</p>
        ) : (
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
        )}
      </Card.Body>
    </Card>
  );
}
