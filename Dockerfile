FROM node:12.10.0@sha256:28ab4c8ed6c0c31326fbe1fe594098ffd8cdb8cf42149f58ffe9d016d76a5a32

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 9090

CMD [ "node", "server.js" ]
