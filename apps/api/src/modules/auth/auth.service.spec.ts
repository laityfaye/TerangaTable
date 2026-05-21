import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';

const MOCK_USER_ID = 'user-uuid-1';
const MOCK_TENANT_ID = 'tenant-uuid-1';

const mockRole = { id: 'role-1', name: 'Manager', slug: 'manager' };

const mockUser = {
  id: MOCK_USER_ID,
  email: 'manager@restaurant.com',
  firstName: 'Alice',
  lastName: 'Dupont',
  tenantId: MOCK_TENANT_ID,
  passwordHash: '',
  isActive: true,
  refreshTokenHash: null,
  passwordResetToken: null,
  passwordResetExpiresAt: null,
  lastLoginAt: null,
  createdAt: new Date(),
  phone: null,
  avatarUrl: null,
  userRoles: [{ role: mockRole }],
};

const makePrisma = () => ({
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
});

const makeJwt = () => ({
  signAsync: jest.fn().mockResolvedValue('signed-token'),
});

const makeConfig = () => ({
  get: jest.fn((key: string, fallback?: string) => {
    const map: Record<string, string> = {
      JWT_SECRET: 'access-secret',
      JWT_REFRESH_SECRET: 'refresh-secret',
      JWT_ACCESS_EXPIRES: '15m',
      JWT_REFRESH_EXPIRES: '7d',
      APP_URL: 'http://localhost:3000',
    };
    return map[key] ?? fallback;
  }),
});

describe('AuthService', () => {
  let service: AuthService;
  let prisma: ReturnType<typeof makePrisma>;
  let jwt: ReturnType<typeof makeJwt>;

  beforeEach(async () => {
    prisma = makePrisma();
    jwt = makeJwt();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        { provide: ConfigService, useValue: makeConfig() },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // ─── login ───────────────────────────────────────────────────────────────

  describe('login', () => {
    it('returns tokens and user profile on success', async () => {
      prisma.user.update.mockResolvedValue(mockUser);

      const result = await service.login(mockUser as any);

      expect(result.access_token).toBe('signed-token');
      expect(result.refresh_token).toBe('signed-token');
      expect(result.user.email).toBe(mockUser.email);
      expect(result.user.roles).toEqual(['manager']);
      expect(prisma.user.update).toHaveBeenCalledTimes(2);
    });

    it('assigns super_admin role when tenantId is null', async () => {
      const superAdmin = { ...mockUser, tenantId: null, userRoles: [] };
      prisma.user.update.mockResolvedValue(superAdmin);

      const result = await service.login(superAdmin as any);

      expect(result.user.roles).toEqual(['super_admin']);
    });
  });

  // ─── refresh ─────────────────────────────────────────────────────────────

  describe('refresh', () => {
    it('returns new token pair for an active user', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, isActive: true });
      prisma.user.update.mockResolvedValue(mockUser);

      const result = await service.refresh(MOCK_USER_ID);

      expect(result.access_token).toBe('signed-token');
      expect(result.refresh_token).toBe('signed-token');
    });

    it('throws UnauthorizedException for inactive user', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, isActive: false });

      await expect(service.refresh(MOCK_USER_ID)).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.refresh(MOCK_USER_ID)).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── forgot-password / reset-password ────────────────────────────────────

  describe('forgotPassword', () => {
    it('always returns { success: true } regardless of email existence', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const result = await service.forgotPassword('unknown@test.com');
      expect(result).toEqual({ success: true });
    });

    it('stores a reset token when email exists', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue(mockUser);

      await service.forgotPassword(mockUser.email);

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: MOCK_USER_ID },
          data: expect.objectContaining({ passwordResetToken: expect.any(String) }),
        }),
      );
    });
  });

  describe('resetPassword', () => {
    const VALID_TOKEN = 'valid-reset-token';

    it('hashes new password and clears tokens on success', async () => {
      const futureDate = new Date(Date.now() + 30 * 60 * 1000);
      prisma.user.findFirst.mockResolvedValue({
        ...mockUser,
        passwordResetToken: VALID_TOKEN,
        passwordResetExpiresAt: futureDate,
      });
      prisma.user.update.mockResolvedValue(mockUser);

      const result = await service.resetPassword(VALID_TOKEN, 'newPassword123');

      expect(result).toEqual({ success: true });
      const updateCall = prisma.user.update.mock.calls[0][0];
      const storedHash = updateCall.data.passwordHash as string;
      const matches = await bcrypt.compare('newPassword123', storedHash);
      expect(matches).toBe(true);
      expect(updateCall.data.passwordResetToken).toBeNull();
      expect(updateCall.data.refreshTokenHash).toBeNull();
    });

    it('throws BadRequestException for expired token', async () => {
      const pastDate = new Date(Date.now() - 1000);
      prisma.user.findFirst.mockResolvedValue({
        ...mockUser,
        passwordResetToken: VALID_TOKEN,
        passwordResetExpiresAt: pastDate,
      });

      await expect(service.resetPassword(VALID_TOKEN, 'newPass')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException for unknown token', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(service.resetPassword('bad-token', 'newPass')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
