FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ARG VITE_API_BASE=/api
ARG VITE_ROUTER_BASENAME=/
ARG VITE_CSRF_COOKIE_NAME=vpn_admin_csrf
ENV VITE_API_BASE=${VITE_API_BASE}
ENV VITE_ROUTER_BASENAME=${VITE_ROUTER_BASENAME}
ENV VITE_CSRF_COOKIE_NAME=${VITE_CSRF_COOKIE_NAME}

RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
