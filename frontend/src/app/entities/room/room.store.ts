import { inject } from "@angular/core";
import { patchState, signalStore, withMethods, withState } from "@ngrx/signals";
import { RoomService } from "./room.service";
import { Room } from "./room.interface";

const initialValue:{
	rooms: Room[],
	currentRoomId: string,
} = {
	rooms: [],
	currentRoomId: ''
}

export const roomStore = signalStore(
	{ providedIn: 'root' },
	withState(initialValue),
	withMethods(state => {
		const api = inject(RoomService)

		const socketPatchState = (res: Room[]) => {
			patchState(state, { rooms: res })
		}

		return {
			loadRooms(){
				return api.loadRooms(socketPatchState)
			},

			setCurrentRoomId(roomId: string){
				patchState(state, { currentRoomId: roomId })
			}
		}
	})
)
