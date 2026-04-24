import { useEffect, useState } from "react";
import { Button, Card, Modal, Table } from "react-bootstrap";
import { deleteUserById, getUsers } from "../api";
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

export default function AdminUsersPage({ notify }) {
  return (
    <AdminAuthGate notify={notify}>
      {(logout) => <AdminUsersContent logout={logout} notify={notify} />}
    </AdminAuthGate>
  );
}

function AdminUsersContent({ logout, notify }) {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const pageSize = 20;

  const loadPage = async (currentPage, by = sortBy, dir = sortDir) => {
    const result = await getUsers({
      page: currentPage,
      page_size: pageSize,
      sort_by: by,
      sort_dir: dir
    });
    const nextRows = Array.isArray(result.items) ? result.items : Array.isArray(result) ? result : [];
    setRows(nextRows);
    setTotal(Number(result.total || nextRows.length || 0));
    setPage(currentPage);
  };

  useEffect(() => {
    loadPage(1).catch((err) => {
      if (String(err.message).toLowerCase().includes("credentials")) {
        logout();
      }
      notify("danger", err.message);
    });
  }, []);

  const handleSort = (column) => {
    const nextDir = column === sortBy && sortDir === "asc" ? "desc" : "asc";
    setSortBy(column);
    setSortDir(nextDir);
    loadPage(1, column, nextDir).catch((err) => notify("danger", err.message));
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteUserById(userToDelete.id);
      notify("success", `Пользователь ${userToDelete.email} удален.`);
      setUserToDelete(null);
      await loadPage(1, sortBy, sortDir);
    } catch (err) {
      notify("danger", err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <Card>
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <Card.Title className="mb-0">Админка: пользователи</Card.Title>
          <Button variant="outline-danger" onClick={logout}>
            Выйти
          </Button>
        </div>
        <div className="table-responsive">
          <Table bordered hover size="sm" className="align-middle mb-0">
            <thead>
              <tr>
                <SortableHeader label="Email" column="email" sortBy={sortBy} sortDir={sortDir} onClick={() => handleSort("email")} />
                <SortableHeader label="Имя" column="first_name" sortBy={sortBy} sortDir={sortDir} onClick={() => handleSort("first_name")} />
                <SortableHeader label="Фамилия" column="last_name" sortBy={sortBy} sortDir={sortDir} onClick={() => handleSort("last_name")} />
                <SortableHeader label="Дата регистрации" column="created_at" sortBy={sortBy} sortDir={sortDir} onClick={() => handleSort("created_at")} />
                <th>Invite код</th>
                <th>Действие</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((user) => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>{user.first_name}</td>
                  <td>{user.last_name || "-"}</td>
                  <td>{formatDate(user.created_at)}</td>
                  <td>{user.invite_code}</td>
                  <td>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => setUserToDelete(user)}
                    >
                      Удалить
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
        <Modal show={Boolean(userToDelete)} onHide={() => !isDeleting && setUserToDelete(null)} centered>
          <Modal.Header closeButton={!isDeleting}>
            <Modal.Title>Подтверждение удаления</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {userToDelete ? `Удалить пользователя ${userToDelete.email}? Действие необратимо.` : ""}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setUserToDelete(null)} disabled={isDeleting}>
              Отмена
            </Button>
            <Button variant="danger" onClick={confirmDeleteUser} disabled={isDeleting}>
              {isDeleting ? "Удаление..." : "Удалить"}
            </Button>
          </Modal.Footer>
        </Modal>
      </Card.Body>
    </Card>
  );
}
