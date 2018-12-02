FROM mhart/alpine-node:11

ARG HOST_USER_ID=1000
ARG HOST_GROUP_ID=1000

ENV HOST_USER_ID=$HOST_USER_ID
ENV HOST_GROUP_ID=$HOST_GROUP_ID

RUN \
  if [ $(getent group ${HOST_GROUP_ID}) ]; then \
    adduser -D -u ${HOST_USER_ID} hydrus; \
  else \
    addgroup -g ${HOST_GROUP_ID} hydrus && \
    adduser -D -u ${HOST_USER_ID} -G hydrus hydrus; \
  fi

WORKDIR /usr/src/app

COPY . .

RUN apk --no-cache add build-base python && \
  yarn --prod && \
  apk del build-base python && \
  chown -R hydrus:hydrus /usr/src/app && \
  mkdir /data && chown -R hydrus:hydrus /data

COPY .docker/docker-entrypoint.sh /usr/local/bin/docker-entrypoint
RUN chmod +x /usr/local/bin/docker-entrypoint

EXPOSE 8000

USER hydrus

ENTRYPOINT ["docker-entrypoint"]
