import { useEffect, useState } from "react";
import { Badge, Button, Card, Form, Modal, Table } from "react-bootstrap";
import { createInviteCodes, deleteInviteCode, getInviteCodes, setInviteCodeTransferred } from "../api";
import AdminAuthGate from "../components/AdminAuthGate";

function formatDate(value) {
  if (!value) return "-";
  const normalized = typeof value === "string" && !/[zZ]|[+-]\d{2}:\d{2}$/.test(value) ? `${value}Z` : value;
  return new Date(normalized).toLocaleString();
}

function SortableHeader({ label, column, sortBy, sortDir, onClick }) {
  const isActive = sortBy === column;
  const icon = isActive ? (sortDir === "asc" ? "bi bi-sort-up" : "bi bi-sort-down") : "bi bi-arrow-down-up";
  return (
    <th role="button" onClick={onClick}>
      <span className="d-inline-flex align-items-center gap-1">
        {label}
        <i className={icon} />
      </span>
    </th>
  );
}

export default function AdminCodesPage({ notify }) {
  return (
    <AdminAuthGate notify={notify}>
      {(logout) => <AdminCodesContent logout={logout} notify={notify} />}
    </AdminAuthGate>
  );
}

function AdminCodesContent({ logout, notify }) {
  const [amount, setAmount] = useState(10);
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const [statusFilter, setStatusFilter] = useState("all");
  const [inviteToDelete, setInviteToDelete] = useState(null);
  const [isDeletingInvite, setIsDeletingInvite] = useState(false);
  const pageSize = 20;

  const loadPage = async (currentPage, by = sortBy, dir = sortDir, filter = statusFilter) => {
    const result = await getInviteCodes({
      page: currentPage,
      page_size: pageSize,
      sort_by: by,
      sort_dir: dir,
      status_filter: filter
    });
    const nextRows = Array.isArray(result.items) ? result.items : Array.isArray(result) ? result : [];
    setRows(nextRows);
    setTotal(Number(result.total || nextRows.length || 0));
    setPage(currentPage);
  };

  const handleSort = (column) => {
    const nextDir = column === sortBy && sortDir === "asc" ? "desc" : "asc";
    setSortBy(column);
    setSortDir(nextDir);
    loadPage(1, column, nextDir, statusFilter).catch((err) => notify("danger", err.message));
  };

  const copy = async (text) => {
    await navigator.clipboard.writeText(text);
    notify("success", "Код скопирован.");
  };

  const handleDeleteInvite = async (item) => {
    if (item.is_used) {
      notify("warning", "Можно удалять только неактивированные коды.");
      return;
    }
    setInviteToDelete(item);
  };

  const toggleTransferred = async (item) => {
    try {
      const next = !item.is_transferred;
      await setInviteCodeTransferred(item.code, next);
      notify("success", next ? `Код ${item.code} помечен как переданный.` : `Метка передачи снята с кода ${item.code}.`);
      await loadPage(1, sortBy, sortDir, statusFilter);
    } catch (err) {
      notify("danger", err.message);
    }
  };

  const confirmDeleteInvite = async () => {
    if (!inviteToDelete || isDeletingInvite) return;
    setIsDeletingInvite(true);
    try {
      await deleteInviteCode(inviteToDelete.code);
      notify("success", `Инвайт-код ${inviteToDelete.code} удален.`);
      setInviteToDelete(null);
      await loadPage(1, sortBy, sortDir, statusFilter);
    } catch (err) {
      notify("danger", err.message);
    } finally {
      setIsDeletingInvite(false);
    }
  };

  useEffect(() => {
    loadPage(1).catch((err) => {
      if (String(err.message).toLowerCase().includes("credentials")) {
        logout();
      }
      notify("danger", err.message);
    });
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <Card>
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <Card.Title className="mb-0">Админка: коды авторизации</Card.Title>
          <Button variant="outline-danger" onClick={logout}>
            Выйти
          </Button>
        </div>

        <div className="d-flex flex-wrap gap-2 mb-3">
          <Form.Control
            style={{ maxWidth: 220 }}
            type="number"
            min="1"
            max="200"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Button
            onClick={async () => {
              try {
                const created = await createInviteCodes(Number(amount));
                const codes = Array.isArray(created)
                  ? created.map((item) => item?.code).filter(Boolean)
                  : [];
                if (codes.length > 0) {
                  await navigator.clipboard.writeText(codes.join("\n"));
                  notify("success", `Коды созданы и скопированы в буфер (${codes.length} шт.).`);
                } else {
                  notify("success", "Коды созданы.");
                }
                await loadPage(1);
              } catch (err) {
                notify("danger", err.message);
              }
            }}
          >
            Создать коды
          </Button>
          <Form.Select
            style={{ maxWidth: 220 }}
            value={statusFilter}
            onChange={(e) => {
              const next = e.target.value;
              setStatusFilter(next);
              loadPage(1, sortBy, sortDir, next).catch((err) => notify("danger", err.message));
            }}
          >
            <option value="all">Все статусы</option>
            <option value="used">Только использованные</option>
            <option value="unused">Только новые</option>
          </Form.Select>
        </div>

        <div className="table-responsive">
          <Table bordered hover size="sm" className="align-middle mb-0">
            <thead>
              <tr>
                <SortableHeader label="Код" column="code" sortBy={sortBy} sortDir={sortDir} onClick={() => handleSort("code")} />
                <SortableHeader label="Статус" column="is_used" sortBy={sortBy} sortDir={sortDir} onClick={() => handleSort("is_used")} />
                <SortableHeader label="Email" column="used_by_email" sortBy={sortBy} sortDir={sortDir} onClick={() => handleSort("used_by_email")} />
                <SortableHeader label="Передан" column="is_transferred" sortBy={sortBy} sortDir={sortDir} onClick={() => handleSort("is_transferred")} />
                <SortableHeader label="Создан" column="created_at" sortBy={sortBy} sortDir={sortDir} onClick={() => handleSort("created_at")} />
                <SortableHeader label="Применен" column="used_at" sortBy={sortBy} sortDir={sortDir} onClick={() => handleSort("used_at")} />
                <th>Действие</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.code}>
                  <td>{item.code}</td>
                  <td>{item.is_used ? <Badge bg="success">Использован</Badge> : <Badge bg="warning">Новый</Badge>}</td>
                  <td>{item.used_by_email || "-"}</td>
                  <td>{item.is_transferred ? <Badge bg="info">Передан</Badge> : <Badge bg="secondary">Не передан</Badge>}</td>
                  <td>{formatDate(item.created_at)}</td>
                  <td>{formatDate(item.used_at)}</td>
                  <td>
                    <Button size="sm" variant="outline-primary" onClick={() => copy(item.code)} title="Копировать код" className="me-2">
                      <i className="bi bi-copy" />
                    </Button>
                    <Button
                      size="sm"
                      variant={item.is_transferred ? "outline-secondary" : "outline-success"}
                      className="me-2"
                      onClick={() => toggleTransferred(item)}
                      title={item.is_transferred ? "Снять метку передачи" : "Пометить как переданный"}
                    >
                      <i className={item.is_transferred ? "bi bi-check2-square" : "bi bi-square"} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => handleDeleteInvite(item)}
                      disabled={item.is_used}
                      title={item.is_used ? "Нельзя удалить использованный код" : "Удалить код"}
                    >
                      <i className="bi bi-trash" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>

        <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mt-3">
          <div>Страница {page} / {totalPages} (всего {total})</div>
          <div className="d-flex gap-2">
            <Button size="sm" variant="outline-secondary" disabled={page <= 1} onClick={() => loadPage(page - 1)}>
              Назад
            </Button>
            <Button size="sm" variant="outline-secondary" disabled={page >= totalPages} onClick={() => loadPage(page + 1)}>
              Вперед
            </Button>
          </div>
        </div>
        <Modal show={Boolean(inviteToDelete)} onHide={() => !isDeletingInvite && setInviteToDelete(null)} centered>
          <Modal.Header closeButton={!isDeletingInvite}>
            <Modal.Title>Подтверждение удаления</Modal.Title>
          </Modal.Header>
          <Modal.Body>{inviteToDelete ? `Удалить инвайт-код ${inviteToDelete.code}?` : ""}</Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setInviteToDelete(null)} disabled={isDeletingInvite}>
              Отмена
            </Button>
            <Button variant="danger" onClick={confirmDeleteInvite} disabled={isDeletingInvite}>
              {isDeletingInvite ? "Удаление..." : "Удалить"}
            </Button>
          </Modal.Footer>
        </Modal>
      </Card.Body>
    </Card>
  );
}
