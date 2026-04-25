import { useState } from "react";
import { Badge, Button, Card, Col, Form, Row, Table } from "react-bootstrap";
import { adminLogin, createInviteCodes, getInviteCodes, getUsers } from "../api";

function inviteCodeStatus(item) {
  if (item.code_status) return item.code_status;
  if (item.is_used) return "used";
  return item.is_transferred ? "transferred" : "new";
}

export default function AdminPanel({ notify }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [amount, setAmount] = useState(10);
  const [inviteCodes, setInviteCodes] = useState([]);
  const [users, setUsers] = useState([]);

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      const data = await adminLogin(username, password);
      setToken(data.access_token);
      const [codesRes, userList] = await Promise.all([
        getInviteCodes({ page: 1, page_size: 500 }),
        getUsers({ page: 1, page_size: 500 })
      ]);
      const codes = Array.isArray(codesRes?.items) ? codesRes.items : Array.isArray(codesRes) ? codesRes : [];
      const users = Array.isArray(userList?.items) ? userList.items : Array.isArray(userList) ? userList : [];
      setInviteCodes(codes);
      setUsers(users);
      notify("success", "Вход в админ-панель выполнен, данные загружены.");
    } catch (err) {
      notify("danger", err.message);
    }
  };

  const refreshData = async () => {
    try {
      const [codesRes, userList] = await Promise.all([
        getInviteCodes({ page: 1, page_size: 500 }),
        getUsers({ page: 1, page_size: 500 })
      ]);
      const codes = Array.isArray(codesRes?.items) ? codesRes.items : Array.isArray(codesRes) ? codesRes : [];
      const users = Array.isArray(userList?.items) ? userList.items : Array.isArray(userList) ? userList : [];
      setInviteCodes(codes);
      setUsers(users);
      notify("info", "Списки обновлены.");
    } catch (err) {
      notify("danger", err.message);
    }
  };

  const handleCreateCodes = async () => {
    try {
      await createInviteCodes(Number(amount));
      notify("success", "Коды успешно созданы.");
      await refreshData();
    } catch (err) {
      notify("danger", err.message);
    }
  };

  return (
    <Card>
      <Card.Body>
        <Card.Title>Админ-панель</Card.Title>
        {!token ? (
          <Form onSubmit={handleLogin}>
            <Row className="g-3">
              <Col md={4}>
                <Form.Control value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Логин" />
              </Col>
              <Col md={4}>
                <Form.Control
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Пароль"
                  required
                />
              </Col>
              <Col md={4}>
                <Button type="submit">Войти</Button>
              </Col>
            </Row>
          </Form>
        ) : (
          <>
            <div className="d-flex gap-2 mb-3">
              <Form.Control
                style={{ maxWidth: 200 }}
                type="number"
                min="1"
                max="200"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <Button onClick={handleCreateCodes}>Создать коды</Button>
              <Button variant="outline-secondary" onClick={refreshData}>Обновить список</Button>
            </div>
            <Row className="g-3">
              <Col lg={6}>
                <h5>Коды регистрации</h5>
                <Table bordered hover size="sm">
                  <thead>
                    <tr>
                      <th>Код</th>
                      <th>Статус</th>
                      <th>Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inviteCodes.map((item) => (
                      <tr key={item.code}>
                        <td>{item.code}</td>
                        <td>
                          {inviteCodeStatus(item) === "used" ? (
                            <Badge bg="success">Использован</Badge>
                          ) : inviteCodeStatus(item) === "transferred" ? (
                            <Badge bg="info">Передан</Badge>
                          ) : (
                            <Badge bg="warning">Новый</Badge>
                          )}
                        </td>
                        <td>{item.used_by_email || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Col>
              <Col lg={6}>
                <h5>Пользователи</h5>
                <Table bordered hover size="sm">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Имя</th>
                      <th>Фамилия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.email}</td>
                        <td>{user.first_name}</td>
                        <td>{user.last_name || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Col>
            </Row>
          </>
        )}
      </Card.Body>
    </Card>
  );
}
