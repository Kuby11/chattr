import { Pipe, PipeTransform } from '@angular/core';
import { Friend } from '../../entities/friend';

@Pipe({
  name: 'searchFilter'
})
export class SearchFilterPipe implements PipeTransform {
  transform(term: Friend[] | undefined, search: string) {
		return term?.filter(term => term.friendOf.username.toLowerCase().includes(search));
	}

}
