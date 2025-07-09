import { Pipe, PipeTransform } from '@angular/core';
import { Friend } from '..';

@Pipe({
  name: 'sortFriendList'
})
export class SortFriendListPipe implements PipeTransform {
  transform(friends: Friend[] | undefined, sortby: string) {
    switch(sortby){
      case 'a-z': 
        return friends?.sort((a: Friend, b: Friend) => {
          return b.friendOf.username.toLowerCase().localeCompare(a.friendOf.username.toLowerCase())
        });
      case 'z-a': 
        return friends?.sort((a: Friend, b: Friend)=>{
          return a.friendOf.username.toLowerCase().localeCompare(b.friendOf.username.toLowerCase())
        })
      case 'latest':
        return friends?.sort((a: Friend, b: Friend) => {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        })
      case 'first':
        return friends?.sort((a: Friend, b: Friend) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })

      default: 
        return friends?.sort()
    }
  }
}
