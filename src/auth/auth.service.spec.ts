import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import * as argon from 'argon2';
import { ConflictException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { AuthDto, LoginDto } from './dto';
import { RoleName } from 'src/generated/prisma/enums';

// Mock argon2
jest.mock('argon2', () => ({
  hash: jest.fn(),
  verify: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let userService: UserService;

  // Mock data chung
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    fullName: 'Test User',
    password: 'hashed_password',
    role: { name: RoleName.USER },
    hashedRefreshToken: null,
  };

  const mockTokens = {
    access_token: 'mock_access_token',
    refresh_token: 'mock_refresh_token',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              create: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {
            update: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    userService = module.get<UserService>(UserService);

    // Reset mock mỗi test
    jest.clearAllMocks();
  });

  describe('register', () => {
    const dto: AuthDto = {
      fullName: 'New User',
      email: 'new@example.com',
      password: 'password123',
    };

    it('should register user successfully', async () => {
      (argon.hash as jest.Mock).mockResolvedValue('hashed_new_password');
      (prisma.user.create as jest.Mock).mockResolvedValue({
        ...mockUser,
        id: 2,
        fullName: dto.fullName,
        email: dto.email,
        password: 'hashed_new_password',
      });

      const result = await service.register(dto);

      expect(result).toEqual({
        id: 2,
        fullName: dto.fullName,
        email: dto.email,
        role: { name: RoleName.USER },
        hashedRefreshToken: null,
        // ... các field khác nếu có
      });
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          fullName: dto.fullName,
          email: dto.email,
          password: 'hashed_new_password',
          role: { connect: { name: RoleName.USER } },
        },
      });
    });

    it('should throw ConflictException if email exists', async () => {
      (argon.hash as jest.Mock).mockResolvedValue('hashed');
      (prisma.user.create as jest.Mock).mockRejectedValue({ code: 'P2002' });

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });

    it('should throw InternalServerErrorException on other errors', async () => {
      (prisma.user.create as jest.Mock).mockRejectedValue(new Error('DB error'));

      await expect(service.register(dto)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('login', () => {
    const dto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login successfully and return safe user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (argon.verify as jest.Mock).mockResolvedValue(true);

      const result = await service.login(dto);

      expect(result).toEqual({
        id: 1,
        email: mockUser.email,
        fullName: mockUser.fullName,
        role: mockUser.role,
        hashedRefreshToken: null,
      });
      expect(argon.verify).toHaveBeenCalledWith(mockUser.password, dto.password);
    });

    it('should throw Unauthorized if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw Unauthorized if password wrong', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (argon.verify as jest.Mock).mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('signJwtToken', () => {
    it('should generate tokens and update refresh token', async () => {
      (jwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce('access_token')
        .mockResolvedValueOnce('refresh_token');
      (argon.hash as jest.Mock).mockResolvedValue('hashed_rt');
      (userService.update as jest.Mock).mockResolvedValue({});

      const result = await service.signJwtToken(1, 'test@example.com', RoleName.USER);

      expect(result).toEqual(mockTokens);
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(userService.update).toHaveBeenCalledWith(1, { hashedRefreshToken: 'hashed_rt' });
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens successfully', async () => {
      (userService.findOne as jest.Mock).mockResolvedValue({
        ...mockUser,
        hashedRefreshToken: 'hashed_old_rt',
        role: { name: RoleName.USER },
      });
      (argon.verify as jest.Mock).mockResolvedValue(true);
      (jwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce('new_access')
        .mockResolvedValueOnce('new_refresh');
      (argon.hash as jest.Mock).mockResolvedValue('new_hashed_rt');
      (userService.update as jest.Mock).mockResolvedValue({});

      const result = await service.refreshTokens(1, 'old_refresh_token');

      expect(result).toEqual({ access_token: 'new_access', refresh_token: 'new_refresh' });
      expect(userService.update).toHaveBeenCalledWith(1, { hashedRefreshToken: 'new_hashed_rt' });
    });

    it('should throw Unauthorized if refresh token invalid', async () => {
      (userService.findOne as jest.Mock).mockResolvedValue({
        ...mockUser,
        hashedRefreshToken: 'hashed_old_rt',
      });
      (argon.verify as jest.Mock).mockResolvedValue(false);

      await expect(service.refreshTokens(1, 'wrong_rt')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw Unauthorized if no user or no hashedRt', async () => {
      (userService.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.refreshTokens(1, 'rt')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should clear hashedRefreshToken', async () => {
      (userService.update as jest.Mock).mockResolvedValue({});

      await service.logout(1);

      expect(userService.update).toHaveBeenCalledWith(1, { hashedRefreshToken: '' });
    });
  });
});