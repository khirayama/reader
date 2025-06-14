#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

// カラー出力用のヘルパー
const colors = {
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const execCommand = (command, description) => {
  try {
    log(`\n🔄 ${description}...`, 'blue');
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    log(`✅ ${description} completed`, 'green');
  } catch (error) {
    log(`❌ Error during: ${description}`, 'red');
    console.error(error.message);
    process.exit(1);
  }
};

const waitForDatabase = async () => {
  const { exec } = require('child_process');
  const maxRetries = 30;
  let retries = 0;

  log('\n⏳ Waiting for PostgreSQL to be ready...', 'yellow');

  return new Promise((resolve, reject) => {
    const checkDatabase = () => {
      exec('docker-compose exec postgres pg_isready -U postgres -d rss_reader', (error) => {
        if (!error) {
          log('✅ PostgreSQL is ready!', 'green');
          resolve();
        } else {
          retries++;
          if (retries >= maxRetries) {
            log('❌ PostgreSQL failed to start within timeout', 'red');
            reject(new Error('Database connection timeout'));
          } else {
            setTimeout(checkDatabase, 2000); // 2秒待機してリトライ
          }
        }
      });
    };
    checkDatabase();
  });
};

const main = async () => {
  try {
    log('🚀 Starting RSS Reader database setup...', 'blue');

    // Docker Composeでデータベースを起動
    execCommand('docker-compose up -d postgres', 'Starting PostgreSQL container');

    // データベースの準備完了まで待機
    await waitForDatabase();

    // Prismaクライアントを生成
    execCommand('npx prisma generate', 'Generating Prisma client');

    // マイグレーションを実行
    execCommand('npx prisma migrate deploy', 'Running database migrations');

    log('\n🎉 Database setup completed successfully!', 'green');
    log('🔗 You can now run: npm run dev:server', 'blue');

  } catch (error) {
    log(`\n❌ Setup failed: ${error.message}`, 'red');
    process.exit(1);
  }
};

main();