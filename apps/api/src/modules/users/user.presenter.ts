import type { IUser } from './user.model';

export type PublicUserSource = {
  _id: unknown;
  name: string;
  email: string;
  role: IUser['role'];
  phone?: string;
  organization?: string;
  city?: string;
  state?: string;
  bio?: string;
  createdAt?: Date;
};

export function publicUser(user: PublicUserSource) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone ?? '',
    organization: user.organization ?? '',
    city: user.city ?? '',
    state: user.state ?? '',
    bio: user.bio ?? '',
    createdAt: user.createdAt ?? null,
  };
}
