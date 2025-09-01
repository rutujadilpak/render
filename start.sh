#!/bin/bash
set -e

# Set default environment variables
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-3001}
export DB_HOST=${DB_HOST:-127.0.0.1}
export DB_PORT=${DB_PORT:-3306}
export DB_USER=${DB_USER:-root}
export DB_PASSWORD=${DB_PASSWORD:-}
export DB_NAME=${DB_NAME:-cobbler_crm}
export X_TOKEN_SECRET=${X_TOKEN_SECRET:-cobbler_super_secret_token_2024}

echo "🚀 Starting Cobbler CRM with MySQL..."
echo "Environment: NODE_ENV=$NODE_ENV, PORT=$PORT, DB_HOST=$DB_HOST, DB_USER=$DB_USER, DB_NAME=$DB_NAME"

# Initialize MySQL data directory if not exists
if [ ! -d "/var/lib/mysql/mysql" ]; then
    echo "📦 Initializing MySQL data directory..."
    mysqld --initialize-insecure --user=mysql --datadir=/var/lib/mysql
    echo "✅ MySQL data directory initialized"
fi

# Create MySQL configuration file
echo "📝 Creating MySQL configuration..."
cat > /etc/mysql/my.cnf << EOF
[mysqld]
datadir=/var/lib/mysql
socket=/var/run/mysqld/mysqld.sock
user=mysql
port=3306
bind-address=0.0.0.0
default-authentication-plugin=mysql_native_password
skip-name-resolve
sql_mode=STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO

[mysql]
socket=/var/run/mysqld/mysqld.sock

[client]
socket=/var/run/mysqld/mysqld.sock
EOF

# Ensure MySQL socket directory exists
mkdir -p /var/run/mysqld
chown mysql:mysql /var/run/mysqld

# Start MySQL server
echo "🔄 Starting MySQL server..."
mysqld_safe --user=mysql &
MYSQL_PID=$!

# Wait for MySQL to be ready
echo "⏳ Waiting for MySQL to be ready..."
for i in {1..30}; do
    if mysqladmin ping --silent; then
        echo "✅ MySQL is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ MySQL failed to start after 30 attempts"
        exit 1
    fi
    sleep 2
done

# Set up database and users
echo "🗄️ Setting up database and users..."
mysql -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;" || true
mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '$DB_PASSWORD';" || true
mysql -e "CREATE USER IF NOT EXISTS '$DB_USER'@'%' IDENTIFIED WITH mysql_native_password BY '$DB_PASSWORD';" || true
mysql -e "GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'%';" || true
mysql -e "GRANT ALL PRIVILEGES ON $DB_NAME.* TO 'root'@'localhost';" || true
mysql -e "FLUSH PRIVILEGES;" || true
echo "✅ Database setup complete!"

# Test database connection
echo "🔍 Testing database connection..."
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD -e "SELECT 1;" $DB_NAME && echo "✅ Database connection successful!" || echo "❌ Database connection failed!"

# Start the Node.js application
echo "🚀 Starting Cobbler CRM application..."
cd /app
exec node dist/app.js
