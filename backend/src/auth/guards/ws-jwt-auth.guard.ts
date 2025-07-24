import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { Socket } from 'socket.io'
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { verify } from 'jsonwebtoken'

@Injectable()
export class WsJwtAuthGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService
  ){
    super()
  }
  
  canActivate( context: ExecutionContext) {
    const client: Socket = context.switchToWs().getClient()
    WsJwtAuthGuard.validateUser(client)    

    return true;
  }

  static validateUser(client: Socket){
    const agent = client.handshake.headers['user-agent']
    if(!agent){
      throw new ForbiddenException('cant define users agent')
    }
    const token = client.handshake.auth.token.split(' ')[1]
    console.log(token)
    const payload = verify(token, process.env.JWT_SECRET as string)
    return payload
  }
}
