import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const UserAgent = createParamDecorator((_: string,ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest();
  return req.headers["user-agent"];
});
