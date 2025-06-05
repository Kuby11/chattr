import { Component, inject, Inject, OnInit, PLATFORM_ID, signal, } from '@angular/core';
import { BrnTooltipContentDirective } from '@spartan-ng/brain/tooltip';
import { HlmTooltipComponent, HlmTooltipTriggerDirective } from '@spartan-ng/ui-tooltip-helm';
import { provideIcons, NgIcon } from '@ng-icons/core'
import { iconoirHalfMoon,iconoirSunLight } from '@ng-icons/iconoir'
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmIconDirective } from '@spartan-ng/ui-icon-helm';
import { LocalStorageService } from '../../shared/services/local-storage-service.service';

@Component({
  selector: 'app-theme-switcher',
  imports: [
    HlmButtonDirective,
    BrnTooltipContentDirective,
    HlmTooltipComponent,
    HlmTooltipTriggerDirective,
    HlmIconDirective,
    HlmButtonDirective,
    NgIcon,
  ],
  template: `
    <hlm-tooltip>
      <button
        hlmBtn
        hlmTooltipTrigger
        position="left"
        aria-describedby="settings"
        size="lg"
        variant="ghost"
        class="px-2 text-md w-11 h-11"
      >
        <ng-icon hlm [name]="buttonIcon()" size="1.7rem" />
      </button>
      <div
        *brnTooltipContent
        class="flex flex-col items-center py-2 w-fit h-fit gap-1"
      >
        <h4 class="text-[1.1rem]">theme</h4>

        <button
          hlmBtn
          size="sm"
          variant="ghost"
          class="flex items-center gap-2"
          (click)="enableLightMode()"
        >
          light
          <ng-icon name="iconoirSunLight" size="1.3rem" />
        </button>
        <button
          hlmBtn
          size="sm"
          variant="ghost"
          class="flex items-center gap-2"
          (click)="enableDarkMode()"
        >
          dark
          <ng-icon name="iconoirHalfMoon" size="1.3rem" />
        </button>
      </div>
    </hlm-tooltip>
  `,
  providers: [provideIcons({ iconoirHalfMoon, iconoirSunLight })],
})
export class ThemeSwitcherComponent implements OnInit {

  localStorageService = inject(LocalStorageService);

  ngOnInit() {
    let savedState = this.localStorageService.getItem('theme') || 'light';
    if (savedState === 'dark') {
      this.enableDarkMode();
    }
  }

  themeState = signal<'light' | 'dark'>('light');
  buttonIcon = signal('iconoirSunLight');

  enableDarkMode = () => {
    this.localStorageService.setItem('theme', 'dark');
    this.buttonIcon.set('iconoirHalfMoon');
    document.documentElement.classList.add('dark');
  };

  enableLightMode = () => {
    this.localStorageService.setItem('theme', 'light');
    this.buttonIcon.set('iconoirSunLight');
    document.documentElement.classList.remove('dark');
  };
}
