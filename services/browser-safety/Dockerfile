FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
COPY services/browser-safety/package.json services/browser-safety/package.json
RUN npm install
COPY . .
CMD ["npm","run","dev","--workspace","@agesoma/browser-safety"]
