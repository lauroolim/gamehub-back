const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

const envVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_S3_REGION',
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLISHABLE_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_BASIC_PLAN_ID',
  'STRIPE_PREMIUM_PLAN_ID',
  'STRIPE_PRICE_GAMEDEV',
  'STRIPE_PRICE_GAMEDEV_BASIC'
];

const vars = envVars
  .filter(key => process.env[key])
  .map(key => `${key}=${process.env[key]}`)
  .join(',');

console.log(vars);