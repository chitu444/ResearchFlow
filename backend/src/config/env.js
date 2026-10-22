import dotenv from 'dotenv';
dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';
const jwtSecret = process.env.JWT_SECRET || 'dev-only-change-me';

if (nodeEnv === 'production' && jwtSecret === 'dev-only-change-me') {
  throw new Error('FATAL: JWT_SECRET must be set to a secure secret in production!');
}

export const env = {
  nodeEnv,
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/researchflow',
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB || 25)
};
