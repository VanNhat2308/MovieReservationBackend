import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { JWTStrategy } from './strategy';
import { JWTRefreshStrategy } from './strategy/jwt-refresh.strategy';

@Module({
  imports: [UserModule,JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService,JWTStrategy,JWTRefreshStrategy],
})
export class AuthModule {}
