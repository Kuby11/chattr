import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { HlmSkeletonComponent } from '@spartan-ng/ui-skeleton-helm';
import { ShortenUsernamePipe } from '../../shared/pipes/shorten-username.pipe';
import { currentPageService } from '../../shared/services';
import { Member, roomStore } from '../../entities/room';
import { AvatarComponent } from '../../shared/ui/avatar/avatar.component';
import { userStore } from '../../entities/user';
import { Profile } from '../../entities/profile';
import { friendsStore } from '../../entities/friend/friend.store';
import { MessageInputComponent } from '../../entities/message/components/message-input/message-input.component';


@Component({
  selector: 'app-chat-page',
  imports: [
    HlmSkeletonComponent,
    ShortenUsernamePipe,
    RouterOutlet,
    AvatarComponent,
    MessageInputComponent,
    RouterLink,
  ],
  templateUrl: './chat-page.component.html',
  styleUrl: './chat-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatPageComponent implements OnInit {
  private readonly pageService = inject(currentPageService);
  private readonly userStore = inject(userStore)
  private readonly inputEl = viewChild<ElementRef<HTMLInputElement>>('el')
  private readonly chatEl = viewChild<ElementRef<HTMLElement>>('chatEl')
 
  protected skeletonItems = signal<number[]>(Array(20).fill(0))

  currentUser = computed(() => this.userStore.currentUser()!)
  roomStore = inject(roomStore)
  friendStore = inject(friendsStore)
  
  get chatOffset(){
    if(!this.inputEl){
      return 0
    }else{
      return (this.inputEl() as any).chatOffset()
    }
  }
 
  scrollToBottom = effect(() => {
    const el = this.chatEl()
    setTimeout(() => {
      if(el){
        el.nativeElement.scrollIntoView({ behavior: 'auto', block: 'end' })
        el.nativeElement.scrollTop = el.nativeElement.offsetHeight
      }
    }, 500);
  })
  
  getUserProfile(members: Member[]): Profile {
    return members.find(member => member.userId !== this.currentUser().id)?.user.profile as Profile
  }

  ngOnInit() {
    this.scrollToBottom
    this.roomStore.loadRooms()
    this.pageService.setPage('chat');
  }
}
