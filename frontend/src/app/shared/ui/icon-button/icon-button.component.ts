import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { BrnTooltipContentDirective } from '@spartan-ng/brain/tooltip';
import { HlmTooltipComponent, HlmTooltipTriggerDirective } from '@spartan-ng/ui-tooltip-helm';

type ButtonVariants = 'default' | 'destructive'

@Component({
	selector: 'app-icon-button',
	imports: [
		BrnTooltipContentDirective,
		HlmTooltipComponent,
		HlmTooltipTriggerDirective
	],
	template: `
		<hlm-tooltip>
			<button
				hlmTooltipTrigger
				[aria-describedby]="tooltipContent()"
				class="flex sm:p-2 p-1 rounded-xl transition hover:bg-destructive/20"
				[class]="variant() === 'destructive' 
					? 'hover:bg-destructive/20 text-destructive' 
					: 'hover:bg-primary/20 text-primary'"
			>
				<ng-content select="ng-icon"/>
			</button>
			<span *brnTooltipContent [class]="variant() === 'destructive' ? 'text-destructive' : ''">{{ tooltipContent() }}</span>
		</hlm-tooltip>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class IconButtonComponent {
	tooltipContent = input.required<string>()
	variant = input<ButtonVariants>('default')
}
