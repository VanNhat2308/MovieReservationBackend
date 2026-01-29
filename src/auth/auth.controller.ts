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
import { Public } from 'src/common/decorators/public.decorator';
import { ApiOperation } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  
  @ApiOperation({ summary: 'User login to obtain access and refresh tokens' })
  @Post('login')
  @Public()
  async login(@Body() LoginDto: LoginDto) {
    const user = await this.authService.login(LoginDto);
    const tokens = await this.authService.signJwtToken(user.id, user.email, user.role.name);
    return tokens;
  }

  @ApiOperation({ summary: 'Register a new user account' })
  @Post('register')
  @Public()
  register(@Body() AuthDto: AuthDto) {
    return this.authService.register(AuthDto);
  }

  @ApiOperation({ summary: 'Refresh access and refresh tokens using a valid refresh token' })
  @Post('refresh')
  @UseGuards(AuthGuard('jwt-refresh'))
  async refresh(@Req() req) {
    const userId = req.user.userId;
    const refreshToken = req.user.refreshToken; // từ strategy
    return this.authService.refreshTokens(userId, refreshToken);
  }
  
  @ApiOperation({ summary: 'Logout user and invalidate refresh token' })
  @Post('logout')
  @UseGuards(AuthGuard('jwt')) // hoặc jwt-refresh tùy thiết kế
  async logout(@Req() req) {
    await this.authService.logout(req.user.userId);
    // res.clearCookie('refresh_token');
    return { message: 'Logged out' };
  }
}
