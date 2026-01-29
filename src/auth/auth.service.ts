import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthDto, LoginDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as argon from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { RoleName } from 'src/generated/prisma/enums';
import { UserService } from 'src/user/user.service';
@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async register(dto: AuthDto) {
    const hashedPassword = await argon.hash(dto.password);
    try {
      const user = await this.prismaService.user.create({
        data: {
          fullName: dto.fullName,
          email: dto.email,
          password: hashedPassword,
          role: {
            connect: { name: RoleName.USER },
          },
        },
      });
      const { password, ...safeUser } = user;
      return safeUser;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Email already exists');
      }
      throw new InternalServerErrorException();
    }
  }

 async login(LoginDto: LoginDto) {
    const user = await this.prismaService.user.findUnique({
      where: { email: LoginDto.email },
      include: {
    role: true,          
  }
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const pwdMatches = await argon.verify( user.password, LoginDto.password);
    if (!pwdMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const { password, ...safeUser } = user;
    return safeUser;
  }

//jwt
// Hàm tạo cặp token
  private async getTokens(userId: number, email: string, roleName: RoleName): Promise<{ access_token: string; refresh_token: string }> {
    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email, roleName },
        { secret: process.env.JWT_SECRET_KEY, expiresIn: '5m' },
      ),
      this.jwtService.signAsync(
        { sub: userId, email, roleName },
        { secret: process.env.JWT_REFRESH_KEY, expiresIn: '7d' },
      ),
    ]);

    return { access_token, refresh_token };
  }

  // Hàm hash refresh token trước khi lưu DB
  private async updateRefreshToken(userId: number, refreshToken: string) {
    const hashedRefreshToken = await argon.hash(refreshToken);
    await this.userService.update(userId, { hashedRefreshToken });
  }

  // Khi login / sign-up thành công → trả cả 2 token
  async signJwtToken(userId: number, email: string, roleName: RoleName): Promise<{ access_token: string; refresh_token: string }> {
    const tokens = await this.getTokens(userId, email, roleName);
    await this.updateRefreshToken(userId, tokens.refresh_token);

    return tokens;
  }

  // Endpoint refresh (gọi khi access token hết hạn)
  async refreshTokens(userId: number, refreshToken: string): Promise<{ access_token: string; refresh_token: string }> {
    const user = await this.userService.findOne(userId);
    if (!user || !user.hashedRefreshToken) throw new UnauthorizedException('Access Denied');

    const rtMatches = await argon.verify(user.hashedRefreshToken, refreshToken);
    if (!rtMatches) throw new UnauthorizedException('Access Denied');

    // Tạo token mới
    const tokens = await this.getTokens(userId, user.email, user.role.name);
    await this.updateRefreshToken(userId, tokens.refresh_token); // rotate refresh token (tăng bảo mật)

    return tokens;
  }

  // Logout: xóa hashedRt
  async logout(userId: number) {
    await this.userService.update(userId, { hashedRefreshToken: '' });
  }



}
