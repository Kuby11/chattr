import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../widgets/sidebar/sidebar.component';
import { HlmToasterComponent } from '@spartan-ng/ui-sonner-helm';
import { toast } from 'ngx-sonner';
import { currentPageService } from '../../shared/services';

@Component({
  selector: 'app-chat-layout',
  imports: [RouterOutlet, SidebarComponent, HlmToasterComponent],
  templateUrl: './chat-layout.component.html',
  styleUrl: './chat-layout.component.css',
  providers: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatLayoutComponent implements OnInit  {
  currentPageService = inject(currentPageService);
  currentPage = computed(() => this.currentPageService._currentPage());

  inputMessage = '';
  inputDescription = '';

  ngOnInit() {
    this.currentPageService.setPage('home'); 
  }

  showToast() {
    toast(this.inputMessage, {
      description: this.inputDescription,
      duration: 1000,
    })
  }
}
