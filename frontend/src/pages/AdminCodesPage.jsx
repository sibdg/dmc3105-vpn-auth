import { useEffect, useState } from "react";
import { Badge, Button, Card, Form, Modal, OverlayTrigger, Table, Tooltip } from "react-bootstrap";
import { createInviteCodes, deleteInviteCode, getInviteCodes, setInviteCodeDeliveryStatus } from "../api";
import AdminAuthGate from "../components/AdminAuthGate";

function formatDate(value) {
  if (!value) return "-";
  const normalized = typeof value === "string" && !/[zZ]|[+-]\d{2}:\d{2}$/.test(value) ? `${value}Z` : value;
  return new Date(normalized).toLocaleString();
}

function buildInviteShareText(code) {
  const appName = import.meta.env.VITE_APP_NAME || "VPN";
  const basename = import.meta.env.VITE_ROUTER_BASENAME || "/";
  const guidesPath = basename === "/" ? "/guides" : `${String(basename).replace(/\/+$/, "")}/guides`;
  const link = typeof window !== "undefined" ? `${window.location.origin}${guidesPath}` : guidesPath;
  return `Подключение ${appName}

Ссылка: ${link}
Инвайт-код: ${code}`;
}

function isNarrowScreenForShare() {
  if (typeof window === "undefined") return false;
  /* Совпадает с Bootstrap md: как у сетки кнопок до d-md-flex */
  return window.matchMedia("(max-width: 767.98px)").matches;
}

function inviteRowCodeStatus(item) {
  if (item.code_status) return item.code_status;
  if (item.is_used) return "used";
  if (item.delivery_status === "transferred") return "transferred";
  return item.is_transferred ? "transferred" : "new";
}

function InviteStatusBadge({ item }) {
  const s = inviteRowCodeStatus(item);
  if (s === "used") return <Badge bg="success">Использован</Badge>;
  if (s === "transferred") return <Badge bg="info">Передан</Badge>;
  return <Badge bg="warning">Новый</Badge>;
}

function ActionTooltip({ id, label, children }) {
  return (
    <OverlayTrigger
      placement="top"
      delay={{ show: 0, hide: 0 }}
      container={typeof document !== "undefined" ? document.body : undefined}
      overlay={<Tooltip id={id}>{label}</Tooltip>}
    >
      {children}
    </OverlayTrigger>
  );
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

  const shareOrCopyInvite = async (code) => {
    const text = buildInviteShareText(code);
    const preferShare = isNarrowScreenForShare() && typeof navigator.share === "function";
    if (preferShare) {
      try {
        await navigator.share({ text });
        notify("success", "Готово.");
        return;
      } catch (err) {
        if (err?.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      notify("success", preferShare ? "Текст приглашения скопирован." : "Приглашение скопировано в буфер.");
    } catch (err) {
      notify("danger", err?.message || "Не удалось скопировать.");
    }
  };

  const handleDeleteInvite = (item) => {
    setInviteToDelete(item);
  };

  const toggleDeliveryStatus = async (item) => {
    const current = inviteRowCodeStatus(item);
    if (current === "used") return;
    const next = current === "transferred" ? "new" : "transferred";
    try {
      await setInviteCodeDeliveryStatus(item.code, next);
      notify(
        "success",
        next === "transferred" ? `Код ${item.code} в статусе «Передан».` : `Код ${item.code} в статусе «Новый».`
      );
      await loadPage(page, sortBy, sortDir, statusFilter);
    } catch (err) {
      notify("danger", err.message);
    }
  };

  const confirmDeleteInvite = async () => {
    if (!inviteToDelete || isDeletingInvite) return;
    setIsDeletingInvite(true);
    try {
      await deleteInviteCode(inviteToDelete.code);
      notify("success", `Инвайт-код ${inviteToDelete.code} скрыт из списка.`);
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
            <option value="unused">Неиспользованные (все)</option>
            <option value="unused_new">Неиспользованные — «Новый»</option>
            <option value="unused_transferred">Неиспользованные — «Передан»</option>
          </Form.Select>
        </div>

        <div className="table-responsive">
          <Table bordered hover size="sm" className="align-middle mb-0">
            <thead>
              <tr>
                <SortableHeader label="Код" column="code" sortBy={sortBy} sortDir={sortDir} onClick={() => handleSort("code")} />
                <SortableHeader label="Статус" column="code_status" sortBy={sortBy} sortDir={sortDir} onClick={() => handleSort("code_status")} />
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
                  <td>
                    <InviteStatusBadge item={item} />
                  </td>
                  <td>{item.used_by_email || "-"}</td>
                  <td>{formatDate(item.created_at)}</td>
                  <td>{formatDate(item.used_at)}</td>
                  <td>
                    <div
                      className="d-grid gap-2 d-md-flex flex-md-nowrap"
                      style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}
                    >
                      <ActionTooltip id={`invite-share-${item.code}`} label="Поделиться текстом приглашения (на ПК — копирование в буфер)">
                        <Button size="sm" variant="outline-info" onClick={() => shareOrCopyInvite(item.code)}>
                          <i className="bi bi-share" />
                        </Button>
                      </ActionTooltip>
                      <ActionTooltip id={`invite-copy-${item.code}`} label="Копировать только код в буфер">
                        <Button size="sm" variant="outline-primary" onClick={() => copy(item.code)}>
                          <i className="bi bi-copy" />
                        </Button>
                      </ActionTooltip>
                      <ActionTooltip
                        id={`invite-del-${item.code}`}
                        label="Скрыть код из списка (строка останется в базе; неиспользованный код станет недоступен для регистрации)"
                      >
                        <span className="d-inline-block">
                          <Button size="sm" variant="outline-danger" onClick={() => handleDeleteInvite(item)}>
                            <i className="bi bi-trash" />
                          </Button>
                        </span>
                      </ActionTooltip>
                      <ActionTooltip
                        id={`invite-tr-${item.code}`}
                        label={
                          inviteRowCodeStatus(item) === "used"
                            ? "Статус использованного кода нельзя менять"
                            : inviteRowCodeStatus(item) === "transferred"
                              ? "Переключить в статус «Новый»"
                              : "Переключить в статус «Передан»"
                        }
                      >
                        <span className="d-inline-block">
                          <Button
                            size="sm"
                            variant={inviteRowCodeStatus(item) === "transferred" ? "outline-secondary" : "outline-success"}
                            onClick={() => toggleDeliveryStatus(item)}
                            disabled={inviteRowCodeStatus(item) === "used"}
                          >
                            <i
                              className={
                                inviteRowCodeStatus(item) === "transferred" ? "bi bi-check2-square" : "bi bi-square"
                              }
                            />
                          </Button>
                        </span>
                      </ActionTooltip>
                    </div>
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
            <Modal.Title>Скрыть из списка</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {inviteToDelete
              ? `Скрыть инвайт-код ${inviteToDelete.code} из админки? Запись останется в базе. Неиспользованный код после скрытия нельзя использовать для регистрации.`
              : ""}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setInviteToDelete(null)} disabled={isDeletingInvite}>
              Отмена
            </Button>
            <Button variant="danger" onClick={confirmDeleteInvite} disabled={isDeletingInvite}>
              {isDeletingInvite ? "Скрытие..." : "Скрыть"}
            </Button>
          </Modal.Footer>
        </Modal>
      </Card.Body>
    </Card>
  );
}
