import { Component, computed, input, output, signal, } from '@angular/core';
import { HlmIconDirective } from '@spartan-ng/ui-icon-helm';
import { provideIcons, NgIcon } from '@ng-icons/core'
import { iconoirEye,iconoirEyeClosed } from '@ng-icons/iconoir'

import { BrnTooltipContentDirective } from '@spartan-ng/brain/tooltip';
import { HlmTooltipComponent, HlmTooltipTriggerDirective } from '@spartan-ng/ui-tooltip-helm';


@Component({
  selector: 'hide-button',
  standalone: true,
  imports: [
    HlmIconDirective, 
    NgIcon,
    BrnTooltipContentDirective,
    HlmTooltipComponent,
    HlmTooltipTriggerDirective,
  ],
  providers: [provideIcons({ iconoirEye, iconoirEyeClosed })],
  template: `  
    <hlm-tooltip>
      <button
        hlmTooltipTrigger
        type="button"
        (click)="hideState() ? hideState.set(false) : hideState.set(true)"
        class="hover:cursor-pointer h-fit p-1 flex"
      >
        <ng-icon
          hlm
          [size]="sizeProps()"
          [name]="iconName()"
        />
      </button>
      <span *brnTooltipContent>hide password</span>
    </hlm-tooltip>
  `,
})
export class HideButton {
  sizeProps = input<string>('sm');
  hideState = signal(false);
  hideStateProps = output<boolean>();

  iconName = computed(() => {
    if (this.hideState()) {
      this.hideStateProps.emit(true);
      return 'iconoirEyeClosed';
    } else {
      this.hideStateProps.emit(false);
      return 'iconoirEye';
    }
  });
} 
