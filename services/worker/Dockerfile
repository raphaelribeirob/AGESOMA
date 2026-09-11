FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
COPY services/worker/package.json services/worker/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/db/package.json packages/db/package.json
RUN npm install
COPY . .
CMD ["npm", "run", "worker"]
