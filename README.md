# VPN Auth + Hysteria 2

Сервис для выдачи доступов в Hysteria 2 через одноразовые регистрационные коды:

- регистрация пользователя по `invite code`;
- подтверждение email кодом из письма;
- хранение имени/фамилии/email;
- автодобавление логина и пароля в `hysteria` (`auth.userpass`);
- админ-панель для генерации кодов и просмотра пользователей.

## Стек

- Backend: `FastAPI + SQLAlchemy + SQLite`
- Frontend: `React + Bootstrap + Vite`

## 1) Backend

```bash
cd backend
python -m venv .venv
# Linux/macOS
source .venv/bin/activate
# Windows PowerShell
# .\.venv\Scripts\Activate.ps1

pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

В `.env` обязательно задай:

- `SECRET_KEY`
- `ADMIN_USERNAME` / `ADMIN_PASSWORD`
- `SMTP_*` для отправки кода подтверждения
- `SMTP_PORT=587` + `SMTP_USE_TLS=true` + `SMTP_USE_SSL=false` (обычно)
- `SMTP_PORT=465` + `SMTP_USE_SSL=true` (implicit SSL)
- `HYSTERIA_CONFIG_PATH` (обычно `/etc/hysteria/config.yaml`)
- `HYSTERIA_RELOAD_COMMAND` (обычно `systemctl restart hysteria-server.service`)
- `CORS_ALLOW_ORIGINS` (например `https://dmc3105.ru,https://hs2.dmc3105.ru`)

## 2) Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev -- --host 0.0.0.0 --port 5173
```

Для продакшена:

```bash
npm run build
```

## Docker Compose deploy

В корне есть `docker-compose.yml` для деплоя backend + frontend:

```bash
docker compose up -d --build
```

Сервисы:

- `backend` (FastAPI, порт 8000 внутри сети docker)
- `frontend` (Nginx + собранный React, порт `80`)

Важно:

- backend использует `./backend/.env` через `env_file`
- SQLite хранится в docker volume `backend_data`
- `.env` нужно один раз создать вручную на VPS, workflow его не перезаписывает

Первичная подготовка на VPS:

```bash
cd /path/to/app
cp backend/.env.example backend/.env
# отредактируй backend/.env
docker compose up -d --build
```

## API (основное)

- `POST /api/auth/request-email-code`
- `POST /api/auth/verify-email-code`
- `POST /api/register`
- `POST /api/profile/request-delete-code`
- `POST /api/profile/delete`
- `POST /api/admin/login`
- `POST /api/admin/invite-codes`
- `GET /api/admin/invite-codes`
- `GET /api/admin/users`

UI пути:

- `/` — регистрация
- `/connection` — данные подключения
- `/delete-profile` — удаление профиля через код
- `/admin` — админ-панель (без кнопки в основном меню)
- `/admin/codes` — управление кодами
- `/admin/users` — список пользователей

## CORS без правок кода

Настраивается через `.env`:

- `CORS_ALLOW_ORIGINS` — список origin через запятую или `*`
- `CORS_ALLOW_METHODS` — список HTTP-методов или `*`
- `CORS_ALLOW_HEADERS` — список заголовков или `*`
- `CORS_ALLOW_CREDENTIALS` — `true/false`

## Как это работает

1. Админ генерирует одноразовые коды.
2. Пользователь вводит email, получает код подтверждения.
3. После подтверждения email проходит регистрацию по invite-коду.
4. Backend генерирует случайный URL-safe base64 логин и добавляет `vpn_username: password` в `auth.userpass` файла Hysteria.
5. Backend перезапускает сервис Hysteria.
6. Пользователь получает учетные данные VPN.

## Рекомендации по продакшену

- Размести backend на том же VPS, где установлен Hysteria.
- Запускай backend под пользователем с правом изменять `config.yaml` и перезапускать сервис.
- Включи HTTPS для frontend и backend (Nginx/Caddy + Let's Encrypt).
- Замени SQLite на PostgreSQL при росте нагрузки.
