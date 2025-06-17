import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'shortenUsername',
})
export class ShortenUsernamePipe implements PipeTransform {
  transform(value: string, maxLength: number = 11): string {
    return value.length > 
      10 ? value.slice(0, maxLength).trim() + '...' 
      : value;
  }
}
