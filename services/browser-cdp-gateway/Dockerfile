FROM node:24-bookworm-slim
WORKDIR /app
COPY package*.json ./
COPY services/browser-cdp-gateway/package.json services/browser-cdp-gateway/package.json
RUN npm install
COPY . .
CMD ["npm","run","dev","--workspace","@agesoma/browser-cdp-gateway"]
