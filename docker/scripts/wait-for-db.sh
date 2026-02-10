#!/bin/sh
set -e

host="$1"
shift
cmd="$@"

until pg_isready -h "$host" -U taggy 2>/dev/null; do
  echo "Waiting for PostgreSQL at $host..."
  sleep 1
done

echo "PostgreSQL is ready!"
exec $cmd
