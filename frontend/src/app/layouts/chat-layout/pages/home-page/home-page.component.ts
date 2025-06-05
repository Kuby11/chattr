import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { HlmIconDirective } from '@spartan-ng/ui-icon-helm';
import { iconoirEmojiTalkingHappy } from '@ng-icons/iconoir'
import { currentPageService } from '../../services';

@Component({
  selector: 'app-home-page',
  imports: [HlmIconDirective,NgIcon],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.css',
  providers: [provideIcons({ iconoirEmojiTalkingHappy })],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomePageComponent implements OnInit {
  private readonly currentPageService = inject(currentPageService);

  ngOnInit(): void {
    this.currentPageService.setPage('home')
  }

}
