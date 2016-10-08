FROM xappmedia/bst-streamer:baseline

MAINTAINER John Kelvie

EXPOSE 10000

WORKDIR /opt/streamer

ENV PATH="/opt/node/bin:${PATH}"

RUN git pull

RUN npm -version

RUN npm install

CMD node bin/server.js