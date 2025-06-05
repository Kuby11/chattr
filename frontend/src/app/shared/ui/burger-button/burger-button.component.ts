import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';

@Component({
  selector: 'app-burger-button',
  template: `
    <button class="h-10 w-10 p-2 flex flex-col justify-evenly cursor-pointer transition-all duration-300 relative"
			(click)="isClosed()"
		>
      <div 
				class="h-0.5 w-full bg-primary rounded transition-all duration-300" 
				[class]="isClosed() ? '' : 'rotate-45 translate-y-[0.4rem]'" >
			</div>
      <div 
				class="h-0.5 w-full bg-primary rounded transition-all duration-300" 
				[class]="isClosed() ? '' : 'opacity-0'" >
			</div>
      <div 
				class="h-0.5 w-full bg-primary rounded transition-all duration-300" 
				[class]="isClosed() ? '' : 'rotate-[-45deg] translate-y-[-0.4rem]'" >
			</div>
    </button>
  `,
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class burgerButtonComponent {
	isClosed = input<boolean>(false);
}
