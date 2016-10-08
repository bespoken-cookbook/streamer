FROM xappmedia/bst-streamer:baseline

MAINTAINER John Kelvie

EXPOSE 10000

WORKDIR /opt/streamer

ENV PATH="/opt/node/bin:${PATH}"

RUN git pull

RUN /opt/node/bin/npm -version

RUN /opt/node/bin/npm install

CMD /opt/node/bin/node bin/server.js