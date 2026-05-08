export function generateAppDockerfile(app: {
  slug: string;
  port: number;
}): string {
  return `FROM node:20-alpine AS base
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --production

COPY . .

ENV NODE_ENV=production
ENV PORT=${app.port}

EXPOSE ${app.port}

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \\
  CMD wget --no-verbose --tries=1 --spider http://localhost:${app.port}/health || exit 1

CMD ["npx", "tsx", "server.ts"]
`;
}

export function generateAppDockerCompose(app: {
  slug: string;
  port: number;
  revenueMode: string;
}): string {
  const envLines = [
    `      - NODE_ENV=production`,
    `      - PORT=${app.port}`,
  ];

  if (app.revenueMode !== "free") {
    envLines.push(`      - STRIPE_PRICE_ID=\${STRIPE_PRICE_ID:-}`);
    envLines.push(`      - STRIPE_SECRET_KEY=\${STRIPE_SECRET_KEY:-}`);
  }

  return `version: "3.9"

services:
  ${app.slug}:
    build: .
    ports:
      - "${app.port}:${app.port}"
    environment:
${envLines.join("\n")}
    restart: unless-stopped
`;
}
