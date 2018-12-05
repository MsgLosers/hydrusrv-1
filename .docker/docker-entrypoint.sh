#!/bin/sh

cp .env.example .env

NODE_ENV="${NODE_ENV:=production}"
URL="${URL:=http://localhost:8000}"
PORT="${PORT:=8000}"
API_BASE="${API_BASE:=/api}"
MEDIA_BASE="${MEDIA_BASE:=/media}"
AUTHENTICATION_DB_PATH="${AUTHENTICATION_DB_PATH:=/data/authentication.db}"
CONTENT_DB_PATH="${CONTENT_DB_PATH:=/data/content.db}"
DB_CHECKPOINT_INTERVAL="${DB_CHECKPOINT_INTERVAL:=3600}"
REGISTRATION_ENABLED="${REGISTRATION_ENABLED:=true}"
AUTHENTICATION_REQUIRED="${AUTHENTICATION_REQUIRED:=true}"
MIN_PASSWORD_LENGTH="${MIN_PASSWORD_LENGTH:=16}"
FILES_PER_PAGE="${FILES_PER_PAGE:=42}"
TAGS_PER_PAGE="${TAGS_PER_PAGE:=42}"
AUTOCOMPLETE_LIMIT="${AUTOCOMPLETE_LIMIT:=10}"
ACCESS_LOGGING_ENABLED="${ACCESS_LOGGING_ENABLED:=false}"
OVERRIDE_ACCESS_LOGFILE_PATH="${OVERRIDE_ACCESS_LOGFILE_PATH:=/data/hydrusrv-logs/access.log}"
ALLOW_CROSS_DOMAIN="${ALLOW_CROSS_DOMAIN:=false}"
HYDRUS_FILES_PATH="${HYDRUS_FILES_PATH:=/data/server_files}"

sed -i "s~NODE_ENV=development~NODE_ENV=$NODE_ENV~g" .env
sed -i "s~URL=https://example.com~URL=$URL~g" .env
sed -i "s~PORT=8000~PORT=$PORT~g" .env
sed -i "s~API_BASE=/api~API_BASE=$API_BASE~g" .env
sed -i "s~MEDIA_BASE=/media~MEDIA_BASE=$MEDIA_BASE~g" .env
sed -i "s~AUTHENTICATION_DB_PATH=./storage/authentication.db~AUTHENTICATION_DB_PATH=$AUTHENTICATION_DB_PATH~g" .env
sed -i "s~CONTENT_DB_PATH=./storage/content.db~CONTENT_DB_PATH=$CONTENT_DB_PATH~g" .env
sed -i "s~DB_CHECKPOINT_INTERVAL=3600~DB_CHECKPOINT_INTERVAL=$DB_CHECKPOINT_INTERVAL~g" .env
sed -i "s~NUMBER_OF_WORKERS=~NUMBER_OF_WORKERS=$NUMBER_OF_WORKERS~g" .env
sed -i "s~REGISTRATION_ENABLED=true~REGISTRATION_ENABLED=$REGISTRATION_ENABLED~g" .env
sed -i "s~AUTHENTICATION_REQUIRED=true~AUTHENTICATION_REQUIRED=$AUTHENTICATION_REQUIRED~g" .env
sed -i "s~MIN_PASSWORD_LENGTH=16~MIN_PASSWORD_LENGTH=$MIN_PASSWORD_LENGTH~g" .env
sed -i "s~FILES_PER_PAGE=42~FILES_PER_PAGE=$FILES_PER_PAGE~g" .env
sed -i "s~TAGS_PER_PAGE=42~TAGS_PER_PAGE=$TAGS_PER_PAGE~g" .env
sed -i "s~AUTOCOMPLETE_LIMIT=10~AUTOCOMPLETE_LIMIT=$AUTOCOMPLETE_LIMIT~g" .env
sed -i "s~ACCESS_LOGGING_ENABLED=false~ACCESS_LOGGING_ENABLED=$ACCESS_LOGGING_ENABLED~g" .env
sed -i "s~OVERRIDE_ACCESS_LOGFILE_PATH=~OVERRIDE_ACCESS_LOGFILE_PATH=$OVERRIDE_ACCESS_LOGFILE_PATH~g" .env
sed -i "s~ALLOW_CROSS_DOMAIN=false~ALLOW_CROSS_DOMAIN=$ALLOW_CROSS_DOMAIN~g" .env
sed -i "s~HYDRUS_FILES_PATH=~HYDRUS_FILES_PATH=$HYDRUS_FILES_PATH~g" .env

touch $AUTHENTICATION_DB_PATH
touch $CONTENT_DB_PATH

yarn migrate

stop() {
  pkill node
  sleep 1
}

trap "stop" SIGTERM

node ./bin/www &

wait $!
