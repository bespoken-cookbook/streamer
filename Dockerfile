FROM xappmedia/bst-streamer:baseline

MAINTAINER John Kelvie

EXPOSE 10000

WORKDIR /opt/streamer

RUN git pull

RUN npm -version

RUN npm install

CMD node bin/server.js