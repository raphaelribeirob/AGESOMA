FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
COPY services/sentinel/package.json services/sentinel/package.json
COPY packages/core/package.json packages/core/package.json
RUN npm install
COPY . .
CMD ["npm","run","dev","--workspace","@agesoma/sentinel"]
