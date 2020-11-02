FROM ech-containers-group.dockerhub.synamedia.com/content-metadata/node:12.18.2-5

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 9090

CMD [ "node", "server.js" ]
