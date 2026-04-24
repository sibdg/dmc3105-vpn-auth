import { useEffect, useState } from "react";
import { Badge, Button, Card, Form, Table } from "react-bootstrap";
import { createInviteCodes, getInviteCodes } from "../api";
import AdminAuthGate from "../components/AdminAuthGate";

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
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
                  <td>{formatDate(item.created_at)}</td>
                  <td>{formatDate(item.used_at)}</td>
                  <td>
                    <Button size="sm" variant="outline-primary" onClick={() => copy(item.code)} title="Копировать код">
                      <i className="bi bi-copy" />
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
      </Card.Body>
    </Card>
  );
}
