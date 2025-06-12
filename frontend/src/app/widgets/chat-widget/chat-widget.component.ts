import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-chat-widget',
  imports: [],
  templateUrl: './chat-widget.component.html',
  styleUrl: './chat-widget.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatWidgetComponent {

}
