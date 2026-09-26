FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
COPY services/model-gateway/package.json services/model-gateway/package.json
RUN npm install
COPY . .
CMD ["npm","run","dev","--workspace","@agesoma/model-gateway"]
