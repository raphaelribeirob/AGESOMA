FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
COPY services/workcell-control-gateway/package.json services/workcell-control-gateway/package.json
RUN npm install
COPY . .
CMD ["npm","run","dev","--workspace","@agesoma/workcell-control-gateway"]
