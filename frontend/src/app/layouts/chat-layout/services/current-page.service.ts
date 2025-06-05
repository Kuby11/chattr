import { Injectable, signal } from '@angular/core';

@Injectable({providedIn: 'root'})
export class currentPageService  {
  _currentPage = signal('');
	
	setPage(page: string) {
		this._currentPage.set(page);	
	}
}
