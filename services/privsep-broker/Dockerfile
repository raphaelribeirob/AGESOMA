FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
COPY services/privsep-broker/package.json services/privsep-broker/package.json
RUN npm install
COPY . .
CMD ["npm","run","dev","--workspace","@agesoma/privsep-broker"]
