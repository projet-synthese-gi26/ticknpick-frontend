FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install && npm ci --prefer-offline

COPY . .

ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_VEHICLE_API_BASE_URL
ARG NEXT_PUBLIC_OSM_BASE_URL
ARG NEXT_PUBLIC_COMPLIANCE_URL

RUN printf "NEXT_PUBLIC_API_BASE_URL=%s\n\
NEXT_PUBLIC_VEHICLE_API_BASE_URL=%s\n\
NEXT_PUBLIC_OSM_BASE_URL=%s\n\
NEXT_PUBLIC_COMPLIANCE_URL=%s\n" \
  "$NEXT_PUBLIC_API_BASE_URL" \
  "$NEXT_PUBLIC_VEHICLE_API_BASE_URL" \
  "$NEXT_PUBLIC_OSM_BASE_URL" \
  "$NEXT_PUBLIC_COMPLIANCE_URL" \
  > .env

FROM node:20-alpine AS runner

RUN apk add --no-cache curl

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
