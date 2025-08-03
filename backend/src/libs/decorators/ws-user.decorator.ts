import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Socket } from 'socket.io'

export const WsUser = createParamDecorator((_: string,ctx: ExecutionContext) => {
  const req: Socket = ctx.switchToWs().getClient()
	return req.data.user
});
