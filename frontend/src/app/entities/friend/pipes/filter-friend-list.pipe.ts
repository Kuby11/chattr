import { Pipe, PipeTransform } from '@angular/core';
import { Friend } from '..';

@Pipe({
  name: 'filterFriendList'
})
export class filterFriendListPipe implements PipeTransform {
  transform(term: Friend[] | undefined, search: string) {
		return term?.filter(term => term.friendOf.username.toLowerCase().includes(search));
	}

}
