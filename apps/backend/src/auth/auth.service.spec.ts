import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let auth: AuthService;
  let users: jest.Mocked<Pick<UsersService, 'create' | 'findByEmail' | 'findById'>>;
  let jwt: jest.Mocked<Pick<JwtService, 'sign'>>;

  beforeEach(() => {
    users = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
    };
    jwt = { sign: jest.fn().mockReturnValue('signed.jwt.token') };
    auth = new AuthService(users as unknown as UsersService, jwt as unknown as JwtService);
  });

  describe('register', () => {
    it('hashes the password, persists the user, and returns a token', async () => {
      users.findByEmail.mockResolvedValue(null);
      users.create.mockImplementation(async ({ email, passwordHash }) => ({
        id: 'u1',
        email,
        passwordHash,
        createdAt: new Date(),
      }) as any);

      const res = await auth.register({ email: 'a@b.com', password: 'password123' });

      expect(users.create).toHaveBeenCalledTimes(1);
      const arg = users.create.mock.calls[0][0];
      expect(arg.passwordHash).not.toBe('password123');
      expect(await bcrypt.compare('password123', arg.passwordHash)).toBe(true);
      expect(res).toEqual({ accessToken: 'signed.jwt.token', user: { id: 'u1', email: 'a@b.com' } });
    });

    it('throws ConflictException when the email already exists', async () => {
      users.findByEmail.mockResolvedValue({ id: 'u1', email: 'a@b.com' } as any);
      await expect(auth.register({ email: 'a@b.com', password: 'password123' })).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(users.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('returns a token for valid credentials', async () => {
      const passwordHash = await bcrypt.hash('password123', 10);
      users.findByEmail.mockResolvedValue({ id: 'u1', email: 'a@b.com', passwordHash } as any);

      const res = await auth.login({ email: 'a@b.com', password: 'password123' });

      expect(res).toEqual({ accessToken: 'signed.jwt.token', user: { id: 'u1', email: 'a@b.com' } });
    });

    it('throws UnauthorizedException for a wrong password', async () => {
      const passwordHash = await bcrypt.hash('password123', 10);
      users.findByEmail.mockResolvedValue({ id: 'u1', email: 'a@b.com', passwordHash } as any);

      await expect(auth.login({ email: 'a@b.com', password: 'wrong-password' })).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when the user is missing', async () => {
      users.findByEmail.mockResolvedValue(null);
      await expect(auth.login({ email: 'x@y.com', password: 'password123' })).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });
});
