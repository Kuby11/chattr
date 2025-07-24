import { JwtAuthGuard } from "./jwt-auth.guard";
import { WsJwtAuthGuard } from "./ws-jwt-auth.guard"; 

export * from "./jwt-auth.guard";
export * from "./ws-jwt-auth.guard";

export const GUARDS = [JwtAuthGuard, WsJwtAuthGuard];
