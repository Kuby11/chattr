import { ChangeDetectionStrategy, Component, input, OnInit } from '@angular/core';
import { HlmAvatarComponent, HlmAvatarFallbackDirective, HlmAvatarImageDirective } from '@spartan-ng/ui-avatar-helm';
import { FirstLetterPipe } from '../../pipes/first-letter.pipe';

@Component({
	selector: 'app-avatar',
	imports: [
		HlmAvatarComponent,
		HlmAvatarImageDirective,
		HlmAvatarFallbackDirective,
		FirstLetterPipe,
	],
	template: `
		<hlm-avatar>
			<img [src]="avatarUrl()" alt="users avatar" hlmAvatarImage>
			<span class="text-background bg-primary" hlmAvatarFallback>{{ fallback()! | firstLetter }}</span>
		</hlm-avatar>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})

export class AvatarComponent {
	avatarUrl = input<string | undefined>('')
	fallback = input<string | undefined>('')
}
