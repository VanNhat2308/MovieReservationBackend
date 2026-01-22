import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import 'dotenv/config';
import { PrismaService } from "src/prisma/prisma.service";
@Injectable()
export class JWTStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(private readonly prismaService: PrismaService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: process.env.JWT_SECRET_KEY!,
        });
    }
   async validate(payload: any) {
        const user = await this.prismaService.user.findUnique({
            where: { id: payload.sub },
        });
        const { password, ...result } = user!;
        return result;
    }
}