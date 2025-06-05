import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { currentPageService } from '../../services';

@Component({
  selector: 'app-settings',
  imports: [],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
  providers: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent implements OnInit  {
  currentPageService = inject(currentPageService);

  ngOnInit() {
    this.currentPageService.setPage('settings');    
  }
}
