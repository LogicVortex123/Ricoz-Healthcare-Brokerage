import bcrypt from 'bcryptjs';

const ROUNDS = 12;
const dummyHashPromise = bcrypt.hash('practicebridge-timing-placeholder', ROUNDS);

export async function hashPassword(password: string) {
  return bcrypt.hash(password, ROUNDS);
}

export async function verifyPassword(password: string, passwordHash?: string) {
  const dummyHash = await dummyHashPromise;
  const matches = await bcrypt.compare(password, passwordHash ?? dummyHash);
  return Boolean(passwordHash) && matches;
}
