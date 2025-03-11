#!/bin/sh
set -e

# Wait for the database to be ready
echo "Waiting for database to be ready..."
# Use a more reliable connection test
max_attempts=60
attempt=0
while [ $attempt -lt $max_attempts ]; do
  if pg_isready -h db -p 5432 -U postgres > /dev/null 2>&1; then
    echo "Database is ready!"
    # Give it a bit more time to fully initialize
    sleep 5
    break
  fi
  attempt=$((attempt+1))
  echo "Database not ready yet (attempt $attempt/$max_attempts). Retrying in 3 seconds..."
  sleep 3
done

if [ $attempt -eq $max_attempts ]; then
  echo "Database did not become ready in time. Continuing anyway..."
fi

# Setup Prisma
echo "Generating Prisma client..."
npx prisma generate

# Create a simple test to see if the database has been initialized
HAS_TABLES=$(PGPASSWORD=postgres psql -h db -U postgres -d reader -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'User')" -t | tr -d '[:space:]')

if [ "$HAS_TABLES" = "f" ]; then
  echo "Database is empty. Running initial migration..."
  echo "Applying migrations..."
  npx prisma migrate deploy

  echo "Seeding database..."
  npx prisma db seed
else
  echo "Database already contains tables. Skipping initialization."
fi

# Then exec the container's main process (what's set as CMD in the Dockerfile)
exec "$@"