import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { User, UserDocument } from '../user/schema/user.schema';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let userModel: any;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Test User',
    email: 'test@example.com',
    mobileNumber: '1234567890',
    password: 'hashedPassword',
    role: 'user',
    comparePassword: jest.fn(),
  };

  const mockUserModel = {
    findOne: jest.fn(),
    findById: jest.fn(),
    select: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userModel = module.get(getModelToken(User.name));
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
    mockConfigService.get.mockReturnValue('test-secret-key');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      identifier: 'test@example.com',
      password: 'password123',
    };

    it('should login successfully with email', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);
      mockUser.comparePassword.mockResolvedValue(true);
      mockJwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await service.login(loginDto);

      expect(result).toEqual({
        message: 'Successfully Logged In',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          _id: mockUser._id,
          name: mockUser.name,
          email: mockUser.email,
          mobileNumber: mockUser.mobileNumber,
          role: mockUser.role,
        },
      });
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        $or: [
          { email: loginDto.identifier.trim() },
          { mobileNumber: loginDto.identifier.trim() },
        ],
      });
      expect(mockUser.comparePassword).toHaveBeenCalledWith(loginDto.password);
    });

    it('should login successfully with mobile number', async () => {
      const loginWithMobile: LoginDto = {
        identifier: '1234567890',
        password: 'password123',
      };

      mockUserModel.findOne.mockResolvedValue(mockUser);
      mockUser.comparePassword.mockResolvedValue(true);
      mockJwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await service.login(loginWithMobile);

      expect(result.message).toBe('Successfully Logged In');
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        $or: [
          { email: loginWithMobile.identifier.trim() },
          { mobileNumber: loginWithMobile.identifier.trim() },
        ],
      });
    });

    it('should trim identifier before querying', async () => {
      const loginWithSpaces: LoginDto = {
        identifier: '  test@example.com  ',
        password: 'password123',
      };

      mockUserModel.findOne.mockResolvedValue(mockUser);
      mockUser.comparePassword.mockResolvedValue(true);
      mockJwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      await service.login(loginWithSpaces);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        $or: [
          { email: 'test@example.com' },
          { mobileNumber: 'test@example.com' },
        ],
      });
    });

    it('should throw BadRequestException when identifier is missing', async () => {
      const invalidDto: LoginDto = {
        identifier: '',
        password: 'password123',
      };

      await expect(service.login(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.login(invalidDto)).rejects.toThrow(
        'Identifier and password are required.',
      );
    });

    it('should throw BadRequestException when password is missing', async () => {
      const invalidDto: LoginDto = {
        identifier: 'test@example.com',
        password: '',
      };

      await expect(service.login(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.login(invalidDto)).rejects.toThrow(
        'Identifier and password are required.',
      );
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials.',
      );
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);
      mockUser.comparePassword.mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials.',
      );
    });
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      name: 'New User',
      email: 'newuser@example.com',
      password: 'password123',
      mobileNumber: '9876543210',
      designation: 'Developer',
      role: 'user',
    };

    const mockUserInstance = {
      _id: '507f1f77bcf86cd799439011',
      name: 'New User',
      email: 'newuser@example.com',
      mobileNumber: '9876543210',
      role: 'user',
      save: jest.fn(),
    };

    beforeEach(() => {
      mockUserInstance.save.mockClear();
    });

    it('should register a new user successfully', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      mockUserInstance.save.mockResolvedValue(mockUserInstance);

      const mockModelConstructor = jest.fn().mockReturnValue(mockUserInstance);
      Object.assign(mockModelConstructor, mockUserModel);

      const testService = new AuthService(
        mockModelConstructor as any,
        jwtService,
        configService,
      );

      const result = await testService.register(registerDto);

      expect(result).toEqual({
        message: 'Created Successfully',
        data: {
          _id: mockUserInstance._id,
          name: mockUserInstance.name,
          email: mockUserInstance.email,
          mobileNumber: mockUserInstance.mobileNumber,
          role: mockUserInstance.role,
        },
      });
      expect(mockUserInstance.save).toHaveBeenCalled();
    });

    it('should trim all input fields', async () => {
      const registerWithSpaces: RegisterDto = {
        name: '  New User  ',
        email: '  newuser@example.com  ',
        password: '  password123  ',
        mobileNumber: '  9876543210  ',
        designation: '  Developer  ',
        role: 'user',
      };

      mockUserModel.findOne.mockResolvedValue(null);
      mockUserInstance.save.mockResolvedValue(mockUserInstance);

      const mockModelConstructor = jest.fn().mockReturnValue(mockUserInstance);
      Object.assign(mockModelConstructor, mockUserModel);

      const testService = new AuthService(
        mockModelConstructor as any,
        jwtService,
        configService,
      );

      await testService.register(registerWithSpaces);

      expect(mockModelConstructor).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
        mobileNumber: '9876543210',
        designation: 'Developer',
        role: 'user',
      });
    });

    it('should use default role "user" when role is not provided', async () => {
      const registerWithoutRole: RegisterDto = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
        mobileNumber: '9876543210',
      };

      mockUserModel.findOne.mockResolvedValue(null);
      mockUserInstance.save.mockResolvedValue(mockUserInstance);

      const mockModelConstructor = jest.fn().mockReturnValue(mockUserInstance);
      Object.assign(mockModelConstructor, mockUserModel);

      const testService = new AuthService(
        mockModelConstructor as any,
        jwtService,
        configService,
      );

      await testService.register(registerWithoutRole);

      expect(mockModelConstructor).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'user',
        }),
      );
    });
    // Replace the two failing test cases in your auth.service.spec.ts file:

    it('should throw BadRequestException when email already exists', async () => {
      // Mock to return existing user - use mockResolvedValue (not Once) for multiple calls
      mockUserModel.findOne.mockResolvedValue(mockUser);

      const mockModelConstructor = jest.fn();
      Object.assign(mockModelConstructor, mockUserModel);

      const testService = new AuthService(
        mockModelConstructor as any,
        jwtService,
        configService,
      );

      // Combine both assertions into one to avoid calling register twice
      await expect(testService.register(registerDto)).rejects.toThrow(
        new BadRequestException('Email already exists.'),
      );

      // Verify findOne was called with email query
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: registerDto.email,
      });
    });

    it('should throw BadRequestException when mobile number already exists', async () => {
      // Set up mocks for two sequential calls
      mockUserModel.findOne
        .mockResolvedValueOnce(null) // First call: email check passes
        .mockResolvedValueOnce(mockUser) // Second call: mobile check fails
        .mockResolvedValueOnce(null) // Third call: email check passes (second test run)
        .mockResolvedValue(mockUser); // All remaining: mobile check fails

      const mockModelConstructor = jest.fn();
      Object.assign(mockModelConstructor, mockUserModel);

      const testService = new AuthService(
        mockModelConstructor as any,
        jwtService,
        configService,
      );

      // Combine both assertions into one to avoid calling register twice
      await expect(testService.register(registerDto)).rejects.toThrow(
        new BadRequestException('Mobile number already exists.'),
      );

      // Verify both checks were called
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: registerDto.email,
      });
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        mobileNumber: registerDto.mobileNumber,
      });
    });

    it('should handle registration without designation', async () => {
      const registerWithoutDesignation: RegisterDto = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
        mobileNumber: '9876543210',
        role: 'user',
      };

      mockUserModel.findOne.mockResolvedValue(null);
      mockUserInstance.save.mockResolvedValue(mockUserInstance);

      const mockModelConstructor = jest.fn().mockReturnValue(mockUserInstance);
      Object.assign(mockModelConstructor, mockUserModel);

      const testService = new AuthService(
        mockModelConstructor as any,
        jwtService,
        configService,
      );

      await testService.register(registerWithoutDesignation);

      expect(mockModelConstructor).toHaveBeenCalledWith(
        expect.objectContaining({
          designation: undefined,
        }),
      );
    });
  });

  describe('refreshToken', () => {
    it('should refresh access token successfully', async () => {
      const refreshToken = 'valid-refresh-token';
      const decodedPayload = { _id: '507f1f77bcf86cd799439011' };

      mockJwtService.verifyAsync.mockResolvedValue(decodedPayload);
      mockJwtService.signAsync.mockResolvedValue('new-access-token');
      mockConfigService.get.mockReturnValue('refresh-secret-key');

      const result = await service.refreshToken(refreshToken);

      expect(result).toEqual({
        message: 'Access token refreshed',
        accessToken: 'new-access-token',
      });
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(refreshToken, {
        secret: 'refresh-secret-key',
      });
    });

    it('should use SECRET_KEY as fallback when REFRESH_SECRET_KEY is not available', async () => {
      const refreshToken = 'valid-refresh-token';
      const decodedPayload = { _id: '507f1f77bcf86cd799439011' };

      mockJwtService.verifyAsync.mockResolvedValue(decodedPayload);
      mockJwtService.signAsync.mockResolvedValue('new-access-token');
      mockConfigService.get
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce('fallback-secret-key');

      const result = await service.refreshToken(refreshToken);

      expect(result.accessToken).toBe('new-access-token');
    });

    it('should throw UnauthorizedException when refresh token is missing', async () => {
      await expect(service.refreshToken('')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.refreshToken('')).rejects.toThrow(
        'Refresh token missing',
      );
    });

    it('should throw UnauthorizedException when refresh token is null', async () => {
      await expect(service.refreshToken(null)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.refreshToken(null)).rejects.toThrow(
        'Refresh token missing',
      );
    });

    it('should throw UnauthorizedException when token is invalid', async () => {
      const invalidToken = 'invalid-token';

      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(service.refreshToken(invalidToken)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.refreshToken(invalidToken)).rejects.toThrow(
        'Invalid refresh token',
      );
    });

    it('should throw UnauthorizedException when token is expired', async () => {
      const expiredToken = 'expired-token';

      mockJwtService.verifyAsync.mockRejectedValue(new Error('Token expired'));

      await expect(service.refreshToken(expiredToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('generateToken', () => {
    it('should generate access token successfully', async () => {
      const payload = { _id: '507f1f77bcf86cd799439011' };
      mockJwtService.signAsync.mockResolvedValue('generated-token');
      mockConfigService.get.mockReturnValue('secret-key');

      const token = await service.generateToken(payload);

      expect(token).toBe('generated-token');
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(payload, {
        secret: 'secret-key',
        expiresIn: '1h',
      });
    });

    it('should handle empty secret key', async () => {
      const payload = { _id: '507f1f77bcf86cd799439011' };
      mockJwtService.signAsync.mockResolvedValue('generated-token');
      mockConfigService.get.mockReturnValue(undefined);

      const token = await service.generateToken(payload);

      expect(token).toBe('generated-token');
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(payload, {
        secret: '',
        expiresIn: '1h',
      });
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate refresh token successfully', async () => {
      const payload = { _id: '507f1f77bcf86cd799439011' };
      mockJwtService.signAsync.mockResolvedValue('generated-refresh-token');
      mockConfigService.get.mockReturnValue('refresh-secret-key');

      const token = await service.generateRefreshToken(payload);

      expect(token).toBe('generated-refresh-token');
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(payload, {
        secret: 'refresh-secret-key',
        expiresIn: '7d',
      });
    });

    it('should use SECRET_KEY as fallback when REFRESH_SECRET_KEY is not available', async () => {
      const payload = { _id: '507f1f77bcf86cd799439011' };
      mockJwtService.signAsync.mockResolvedValue('generated-refresh-token');
      mockConfigService.get
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce('fallback-secret-key');

      const token = await service.generateRefreshToken(payload);

      expect(token).toBe('generated-refresh-token');
    });

    it('should handle all secrets missing', async () => {
      const payload = { _id: '507f1f77bcf86cd799439011' };
      mockJwtService.signAsync.mockResolvedValue('generated-refresh-token');
      mockConfigService.get.mockReturnValue(undefined);

      const token = await service.generateRefreshToken(payload);

      expect(token).toBe('generated-refresh-token');
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(payload, {
        secret: '',
        expiresIn: '7d',
      });
    });
  });

  describe('verifyToken', () => {
    it('should verify token successfully', async () => {
      const token = 'valid-token';
      const secret = 'secret-key';
      const decodedPayload = { _id: '507f1f77bcf86cd799439011' };

      mockJwtService.verifyAsync.mockResolvedValue(decodedPayload);

      const result = await service.verifyToken(token, secret);

      expect(result).toEqual(decodedPayload);
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(token, {
        secret,
      });
    });

    it('should throw error for invalid token', async () => {
      const token = 'invalid-token';
      const secret = 'secret-key';

      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(service.verifyToken(token, secret)).rejects.toThrow(
        'Invalid token',
      );
    });
  });

  describe('validateUser', () => {
    it('should validate and return user successfully', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const userWithoutPassword = {
        _id: userId,
        name: 'Test User',
        email: 'test@example.com',
        mobileNumber: '1234567890',
        role: 'user',
      };

      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(userWithoutPassword),
      });

      const result = await service.validateUser(userId);

      expect(result).toEqual(userWithoutPassword);
      expect(mockUserModel.findById).toHaveBeenCalledWith(userId);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      const userId = '507f1f77bcf86cd799439011';

      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await expect(service.validateUser(userId)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.validateUser(userId)).rejects.toThrow(
        'User not found',
      );
    });

    it('should exclude password from returned user', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const selectMock = jest.fn().mockResolvedValue({
        _id: userId,
        name: 'Test User',
      });

      mockUserModel.findById.mockReturnValue({
        select: selectMock,
      });

      await service.validateUser(userId);

      expect(selectMock).toHaveBeenCalledWith('-password');
    });
  });
});
