FROM node:24-bookworm-slim
WORKDIR /app
COPY package*.json ./
COPY services/browser-subagent/package.json services/browser-subagent/package.json
RUN npm install
COPY . .
CMD ["npm","run","dev","--workspace","@agesoma/browser-subagent"]
