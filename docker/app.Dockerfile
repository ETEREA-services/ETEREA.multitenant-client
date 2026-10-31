# syntax=docker/dockerfile:1

FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
ARG APP=contable
RUN npx nx build ${APP} --configuration=production --skip-nx-cache

FROM nginx:1.27-alpine AS runtime
ARG APP=contable

# Certificado auto-firmado: el cliente se publica por HTTPS (443) igual que
# los clientes de UM. El 80 solo redirige a HTTPS.
RUN apk add --no-cache openssl \
    && mkdir -p /etc/nginx/ssl \
    && openssl req -x509 -nodes -days 825 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/nginx.key -out /etc/nginx/ssl/nginx.crt \
    -subj "/C=AR/ST=Mendoza/L=Mendoza/O=Eterea/OU=Contable/CN=eterea.local"

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/apps/${APP}/browser /usr/share/nginx/html

# Inyecta API_URL, ENV_NAME y APP_VERSION en runtime (los placeholders viven
# en el bundle de produccion, no en el HTML).
COPY docker/entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 80 443

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
