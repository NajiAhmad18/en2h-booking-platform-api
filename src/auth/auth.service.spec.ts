/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hash'),
  compare: jest.fn().mockResolvedValue(true),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should successfully register a user', async () => {
      const dto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password1!',
      };
      const expectedUser = {
        id: 'uuid',
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hash',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      usersService.findByEmail.mockResolvedValue(null);
      configService.get.mockImplementation((key) =>
        key === 'BCRYPT_SALT_ROUNDS' ? '1' : '15m',
      );
      usersService.create.mockResolvedValue(expectedUser);
      jwtService.sign.mockReturnValue('jwt-token');

      const result = await service.register(dto);

      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.hash).toHaveBeenCalledWith('Password1!', 1);
      expect(usersService.create).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hash',
      });
      expect(result.accessToken).toBe('jwt-token');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('should normalize email to lowercase', async () => {
      const dto = {
        name: 'Test User',
        email: 'TEST@EXAMPLE.COM',
        password: 'Password1!',
      };
      usersService.findByEmail.mockResolvedValue(null);
      configService.get.mockReturnValue('1');
      usersService.create.mockResolvedValue({
        id: 'uuid',
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hash',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      jwtService.sign.mockReturnValue('jwt-token');

      await service.register(dto);

      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'test@example.com' }),
      );
    });

    it('should throw ConflictException if user already exists', async () => {
      const dto = {
        name: 'Test',
        email: 'test@example.com',
        password: 'Password1!',
      };
      usersService.findByEmail.mockResolvedValue({
        id: 'uuid',
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hash',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });

    it('should translate Prisma unique constraint error to ConflictException', async () => {
      const dto = {
        name: 'Test',
        email: 'test@example.com',
        password: 'Password1!',
      };
      usersService.findByEmail.mockResolvedValue(null);
      configService.get.mockReturnValue('1');

      const prismaError = new Prisma.PrismaClientKnownRequestError('error', {
        code: 'P2002',
        clientVersion: '5',
      });
      usersService.create.mockRejectedValue(prismaError);

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should successfully login a user', async () => {
      const dto = { email: 'test@example.com', password: 'Password1!' };
      const user = {
        id: 'uuid',
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hash',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      usersService.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
      jwtService.sign.mockReturnValue('jwt-token');
      configService.get.mockReturnValue('15m');

      const result = await service.login(dto);

      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('Password1!', 'hash');
      expect(result.accessToken).toBe('jwt-token');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('should throw UnauthorizedException if user does not exist', async () => {
      const dto = { email: 'nonexistent@example.com', password: 'Password1!' };
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is wrong', async () => {
      const dto = { email: 'test@example.com', password: 'WrongPassword' };
      const user = {
        id: 'uuid',
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hash',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      usersService.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });
  });
});
