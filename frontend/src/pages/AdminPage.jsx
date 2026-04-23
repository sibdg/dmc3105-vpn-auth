import { Nav } from "react-bootstrap";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import AdminCodesPage from "./AdminCodesPage";
import AdminUsersPage from "./AdminUsersPage";

export default function AdminPage({ notify }) {
  const { pathname } = useLocation();
  return (
    <>
      <Nav variant="tabs" className="mb-3">
        <Nav.Item>
          <Nav.Link as={Link} to="/admin/codes" active={pathname === "/admin/codes"}>
            Коды
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link as={Link} to="/admin/users" active={pathname === "/admin/users"}>
            Пользователи
          </Nav.Link>
        </Nav.Item>
      </Nav>
      <Routes>
        <Route path="codes" element={<AdminCodesPage notify={notify} />} />
        <Route path="users" element={<AdminUsersPage notify={notify} />} />
        <Route path="*" element={<Navigate to="/admin/codes" replace />} />
      </Routes>
    </>
  );
}
