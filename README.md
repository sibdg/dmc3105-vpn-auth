# VPN Auth + Hysteria 2

Сервис выдачи доступов в Hysteria 2 через одноразовые invite-коды с email-подтверждением, админкой и авто-обновлением `auth.userpass`.

## Что умеет

- регистрация пользователя по invite-коду;
- подтверждение email кодом;
- генерация безопасного VPN-логина (URL-safe base64, не email);
- создание/удаление пользователя в конфиге Hysteria;
- страница подключения с URI и QR;
- админка: создание/просмотр/удаление неиспользованных invite-кодов;
- админка: просмотр и удаление пользователей (с подтверждением);
- страница согласия на обработку персональных данных;
- deploy через Docker Compose + GitHub Actions.

## Структура env-файлов

В проекте специально разделены конфиги:

- `./.env` — переменные `docker-compose` (порты, пути, frontend build args);
- `./backend/.env` — backend runtime (секреты, SMTP, hysteria пути/команды);
- `./frontend/.env` — frontend dev-переменные (Vite).

Шаблоны:

- `./.env.example`
- `./backend/.env.example`
- `./frontend/.env.example`

## Быстрый старт на VPS (рекомендуется)

Используй интерактивный идемпотентный скрипт:

```bash
cd /path/to/vpn-auth
bash deploy/setup.sh
```

Что делает скрипт:

- создает или перенастраивает `.env` / `backend/.env` / `frontend/.env`;
- спрашивает параметры в порядке, в котором они записаны в соответствующем `*.env.example`;
- при Enter берет значение из текущего `.env` (если ключ уже есть), иначе из `*.env.example`;
- при желании создает/обновляет systemd units для авто-перезапуска Hysteria по изменению `config.yaml`;
- безопасно запускается повторно (idempotent).

После настройки:

```bash
docker compose --env-file .env up -d --build --remove-orphans
```

## Systemd watcher для Hysteria (опционально)

Скрипт может создать:

- `/etc/systemd/system/hysteria-reload-on-config-change.service`
- `/etc/systemd/system/hysteria-reload-on-config-change.path`

`*.path` следит за изменениями `HYSTERIA_CONFIG_PATH` и запускает команду перезапуска.

## Локальная разработка

### Backend

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

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev -- --host 0.0.0.0 --port 5173
```

## Ключевые переменные

### `.env` (root)

- `FRONTEND_HOST_PORT`
- `BACKEND_HOST_PORT`
- `HYSTERIA_CONFIG_HOST_PATH`
- `HYSTERIA_CONFIG_CONTAINER_PATH`
- `VITE_API_BASE`
- `VITE_ROUTER_BASENAME`
- `VITE_HYSTERIA_URI_TAG`

### `backend/.env`

- `SECRET_KEY`
- `ADMIN_USERNAME`, `ADMIN_PASSWORD`
- `SMTP_*`
- `HYSTERIA_CONFIG_PATH`
- `HYSTERIA_RELOAD_COMMAND`
- `REGISTRATION_BASE_URL`
- `CORS_ALLOW_*`

## API

### Public

- `POST /api/auth/request-email-code`
- `POST /api/auth/verify-email-code`
- `POST /api/register`
- `POST /api/profile/request-delete-code`
- `POST /api/profile/delete`

### Admin

- `POST /api/admin/login`
- `POST /api/admin/logout`
- `GET /api/admin/session`
- `POST /api/admin/invite-codes`
- `GET /api/admin/invite-codes`
- `DELETE /api/admin/invite-codes/{code}` (только неиспользованные)
- `GET /api/admin/users`
- `DELETE /api/admin/users/{user_id}`

## UI маршруты

- `/` — регистрация
- `/connection` — URI + QR для подключения
- `/delete-profile` — удаление профиля по коду
- `/consent` — согласие на обработку персональных данных
- `/admin/codes` — админка кодов
- `/admin/users` — админка пользователей

## Как работает регистрация

1. Пользователь вводит email и принимает согласие на обработку ПД.
2. Получает и подтверждает email-код.
3. Вводит invite-код и данные профиля.
4. Backend генерирует VPN username (URL-safe base64) и пароль.
5. Backend добавляет `vpn_username: password` в `auth.userpass` Hysteria.
6. Пользователь получает готовую `hysteria2://` ссылку и QR.

## GitHub Actions Deploy

Workflow: `.github/workflows/deploy.yaml`

- копирует проект на VPS;
- проверяет, что `backend/.env` и root `.env` существуют;
- выполняет `docker compose --env-file .env up -d --build --remove-orphans`.

Рекомендуемый путь: один раз запустить `deploy/setup.sh` на VPS, затем использовать автодеплой.
