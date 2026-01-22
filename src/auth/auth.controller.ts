import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto, LoginDto } from './dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() LoginDto: LoginDto) {
    const user = await this.authService.login(LoginDto);
    const tokens = await this.authService.signJwtToken(user.id, user.email);
    return tokens;
  }

  @Post('register')
  register(@Body() AuthDto: AuthDto) {
    return this.authService.register(AuthDto);
  }

  @Post('refresh')
  @UseGuards(AuthGuard('jwt-refresh'))
  async refresh(@Req() req) {
    const userId = req.user.userId;
    const refreshToken = req.user.refreshToken; // từ strategy
    return this.authService.refreshTokens(userId, refreshToken);
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt')) // hoặc jwt-refresh tùy thiết kế
  async logout(@Req() req) {
    await this.authService.logout(req.user.userId);
    // res.clearCookie('refresh_token');
    return { message: 'Logged out' };
  }
}
