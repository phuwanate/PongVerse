#!/bin/bash
# set -e

# Check if the data directory is empty
if [ "$(ls -A /var/lib/postgresql/data)" ]; then
  echo "Data directory is not empty, skipping initialization."
  if [ "$(ls -A /var/lib/postgresql/data/data)" ]; then
    mv /var/lib/postgresql/data/data/* /var/lib/postgresql/data
    rmdir /var/lib/postgresql/data/data/
  fi
else
  echo "Data directory is empty, initializing database..."

  docker-entrypoint.sh postgres &  #start on back ground
  # Wait for PostgreSQL to start
  until pg_isready -U postgres; do
    echo "Waiting for PostgreSQL to be ready..."
    sleep 2
  done

  NEW_USER_PASSWORD=$(cat /run/secrets/postgres_pwd)
  # Check if the user exists and create it if it does not
  if ! psql -U postgres -c '\du' | cut -d \| -f 1 | grep -qw $POSTGRES_DJANGO_USER; then
    echo "User ${POSTGRES_DJANGO_USER} does not exist. Creating it..."
    psql -U postgres -c "CREATE USER ${POSTGRES_DJANGO_USER} WITH PASSWORD '${NEW_USER_PASSWORD}';"

    # Grant all privileges on the database to the user
    echo "Granting all privileges on database ${POSTGRES_DB} to user ${POSTGRES_DJANGO_USER}..."
    psql -U postgres -d $POSTGRES_DB -c "GRANT ALL PRIVILEGES ON DATABASE ${POSTGRES_DB} TO ${POSTGRES_DJANGO_USER};"
    psql -U postgres -d $POSTGRES_DB -c "GRANT USAGE ON SCHEMA public TO ${POSTGRES_DJANGO_USER};"
    psql -U postgres -d $POSTGRES_DB -c "GRANT CREATE ON SCHEMA public TO ${POSTGRES_DJANGO_USER};"
    psql -U postgres -c "ALTER USER ${POSTGRES_DJANGO_USER} CREATEDB;"
  else
    echo "User ${POSTGRES_DJANGO_USER} already exists."
  fi

  PG_PID=$!
  kill -SIGTERM $PG_PID
  sleep 2
fi

exec docker-entrypoint.sh postgres #start postgres on fore ground