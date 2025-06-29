import { Component, inject, Inject, OnInit, PLATFORM_ID, signal, } from '@angular/core';


import { provideIcons, NgIcon } from '@ng-icons/core'
import { iconoirHalfMoon,iconoirSunLight } from '@ng-icons/iconoir'
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmIconDirective } from '@spartan-ng/ui-icon-helm';
import { LocalStorageService } from '../../shared/services';

@Component({
  selector: 'app-theme-switcher',
  imports: [
    HlmButtonDirective,
    HlmIconDirective,
    HlmButtonDirective,
    NgIcon,
  ],
  template: `
      <button
        hlmBtn
        aria-describedby="settings"
        size="lg"
        variant="ghost"
        class="px-2 text-md w-11 h-11"
        (click)="themeState() === 'light' ? enableDarkMode() : enableLightMode()"
      >
        <ng-icon hlm [name]="buttonIcon()" size="1.7rem" />     
      </button>
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
    this.themeState.set('dark');
    document.documentElement.classList.add('dark');
  };
  
  enableLightMode = () => {
    this.localStorageService.setItem('theme', 'light');
    this.buttonIcon.set('iconoirSunLight');
    this.themeState.set('light');
    document.documentElement.classList.remove('dark');
  };
}
