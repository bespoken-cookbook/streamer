FROM xappmedia/bst-streamer:clean

MAINTAINER John Kelvie

EXPOSE 10000

WORKDIR /opt/streamer

ENV PATH="/opt/node/bin:${PATH}"

COPY bin/ ./bin/

COPY lib/ ./lib/

COPY test/ ./test/

COPY *.yml ./

COPY *.json ./

RUN npm -version

RUN npm install

CMD node bin/server.js