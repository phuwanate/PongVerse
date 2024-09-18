#!/bin/bash

set -e
# Check if the database exists and create it if it does not
if ! psql -U postgres -lqt | cut -d \| -f 1 | grep -qw $POSTGRES_DB; then
  echo "Database '${POSTGRES_DB}' does not exist. Creating it..."
  psql -U postgres -c "CREATE DATABASE ${POSTGRES_DB};"
else
  echo "Database '${POSTGRES_DB}' already exists."
fi
