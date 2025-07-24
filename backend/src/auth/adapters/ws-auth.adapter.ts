import { INestApplication } from "@nestjs/common";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { ServerOptions } from "socket.io";
import { wsAuthMiddleware } from "../middlewares";

export class WsAuthAdapter extends IoAdapter {
	constructor(private app: INestApplication){
		super(app)
	}

	createIOServer(port: number, options?: ServerOptions) {
		const server = super.createIOServer(port, options)
		server.use(wsAuthMiddleware)
		return server
	}

}
