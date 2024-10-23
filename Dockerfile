
FROM node:20-alpine

WORKDIR /app/chess

COPY chess/package*.json ./

RUN npm install

COPY ./chess/ .

RUN npm run build

WORKDIR /app/server

COPY server/package*.json ./

RUN npm install

COPY server/ .

RUN npm run build

EXPOSE 3000 4000

CMD ["sh", "-c", "cd /app/server && npm start & cd /app/chess && npm run start"]