import { Component } from '@angular/core';

@Component({
	selector: 'app-loader',
	template: `
		<div
			class="w-10 h-10 border-4 border-t-primary border-foreground/20 rounded-full animate-spin"
		></div>
	`
})

export class LoaderComponent  {}
