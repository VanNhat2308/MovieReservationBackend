import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { JWTStrategy } from './strategy';
import { JWTRefreshStrategy } from './strategy/jwt-refresh.strategy';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [UserModule,JwtModule.register({}),PrismaModule],
  controllers: [AuthController],
  providers: [AuthService,JWTStrategy,JWTRefreshStrategy],
})
export class AuthModule {}
