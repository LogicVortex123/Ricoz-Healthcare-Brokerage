import { connectDb, disconnectDb } from '../config/db';
import { loadEnv } from '../config/env';
import { User, type UserRole } from '../modules/users/user.model';
import { hashPassword } from '../utils/password';

function arg(name: string) {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

async function main() {
  const env = loadEnv();
  const role = (arg('role') ?? process.env.ADMIN_ROLE ?? 'ADMIN') as UserRole;
  const name = arg('name') ?? process.env.ADMIN_NAME;
  const email = (arg('email') ?? process.env.ADMIN_EMAIL)?.toLowerCase();
  const password = arg('password') ?? process.env.ADMIN_PASSWORD;
  const reset = process.argv.includes('--reset-password');

  if (role !== 'ADMIN' && role !== 'BROKER') {
    console.error('[practicebridge] This script can only create ADMIN or BROKER users.');
    process.exit(1);
  }
  if (!name || !email || !password) {
    console.error('[practicebridge] Provide --name, --email, and --password, or set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD.');
    process.exit(1);
  }
  if (password.length < 10 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    console.error('[practicebridge] Password must be 10 to 72 characters and include a letter and a number.');
    process.exit(1);
  }

  await connectDb(env.mongodbUri);
  const existing = await User.findOne({ email });
  if (existing && existing.role !== role) {
    console.error('[practicebridge] That email already belongs to a different role. No change was made.');
    await disconnectDb();
    process.exit(1);
  }
  if (existing && !reset) {
    console.log(`[practicebridge] ${role} user already exists for ${email}.`);
    await disconnectDb();
    return;
  }
  const passwordHash = await hashPassword(password);
  if (existing) {
    await User.updateOne({ _id: existing._id }, { $set: { name, passwordHash } });
    console.log(`[practicebridge] Updated ${role} user ${email}.`);
  } else {
    await User.create({ name, email, passwordHash, role });
    console.log(`[practicebridge] Created ${role} user ${email}.`);
  }
  await disconnectDb();
}

void main().catch(async (error: unknown) => {
  const message = error instanceof Error ? error.message.replace(/mongodb(?:\+srv)?:\/\/\S+/gi, 'mongodb://[redacted]') : 'Unknown error';
  console.error(`[practicebridge] ${message}`);
  await disconnectDb().catch(() => undefined);
  process.exit(1);
});
