import { ForbiddenException, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport"
import { ExtractJwt, Strategy } from "passport-jwt";
import { JwtPayload } from "../interfaces";
import { ConfigService } from "@nestjs/config";
import { UserService } from "src/user/user.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow("JWT_SECRET"),
      passReqToCallback: false,

    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userService.findOne(payload.id).catch((err) => {
      this.logger.error(err);
      return null;
    });

    if(!user) throw new UnauthorizedException("Invalid payload");
    if(user.isBlocked) throw new ForbiddenException("can`t access the user");
    return payload;
  }
}
