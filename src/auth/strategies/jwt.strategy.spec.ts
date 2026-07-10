import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('secret'),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    usersService = module.get(UsersService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return a user without passwordHash for a valid payload', async () => {
      const user = {
        id: 'uuid',
        name: 'Test',
        email: 'test@example.com',
        passwordHash: 'hash',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      usersService.findById.mockResolvedValue(user);

      const result = await strategy.validate({
        sub: 'uuid',
        email: 'test@example.com',
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(usersService.findById).toHaveBeenCalledWith('uuid');
      expect(result).not.toHaveProperty('passwordHash');
      expect(result.email).toBe('test@example.com');
    });

    it('should throw UnauthorizedException for a nonexistent user', async () => {
      usersService.findById.mockResolvedValue(null);

      await expect(
        strategy.validate({ sub: 'uuid', email: 'test@example.com' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
