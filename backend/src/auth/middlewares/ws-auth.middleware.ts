import { Socket } from 'socket.io'
import { WsJwtAuthGuard } from '../guards'

export type WsMiddleware  = {
	(client: Socket, next: (err?: Error) => void)	
}

export const wsAuthMiddleware = (): WsMiddleware => {
	return (client: Socket, next) => {
		try{
			WsJwtAuthGuard.validateUser(client)
			next()
		}catch(err){
			next(err)
		}
	}
} 
