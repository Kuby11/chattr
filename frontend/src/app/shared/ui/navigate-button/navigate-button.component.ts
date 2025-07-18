import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft } from '@ng-icons/lucide';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmIconDirective } from '@spartan-ng/ui-icon-helm';


@Component({
	selector: 'app-navigate-button',
	imports: [
		NgIcon,
		HlmIconDirective,
		HlmButtonDirective,
		RouterLink,
	],
	template: `
		<button 
			hlmBtn 
			class="absolute w-fit p-2" 
			variant="ghost" 
			[routerLink]="route() || '/'"
		>
			<ng-icon hlm name="iconoirArrowLeft" />
		</button>
	`,
	providers: [
		provideIcons({lucideArrowLeft})
	],
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class NavigateButtonComponent {
	route = input<string>()
}
