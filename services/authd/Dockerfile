FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
COPY services/authd/package.json services/authd/package.json
COPY packages/db/package.json packages/db/package.json
RUN npm install
COPY . .
CMD ["npm","run","dev","--workspace","@agesoma/authd"]
