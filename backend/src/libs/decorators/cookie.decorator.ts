import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const Cookie = createParamDecorator((key: string, ctx: ExecutionContext) => {
	const req = ctx.switchToHttp().getRequest()	
	return key && key in req.cookies ? req.cookies[key] : key ? null :  req.cookies;
})
