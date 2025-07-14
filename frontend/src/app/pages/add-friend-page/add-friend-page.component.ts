import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { iconoirSearch, iconoirArrowLeft } from '@ng-icons/iconoir'
import { HlmIconDirective } from '@spartan-ng/ui-icon-helm';
import { RouterLink } from '@angular/router';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmFormFieldComponent, HlmFormFieldModule } from '@spartan-ng/ui-formfield-helm';
import { FormsModule } from '@angular/forms';
import { userStore } from '../../entities/user';


@Component({
  selector: 'app-add-friend-page',
  imports: [
    HlmInputDirective,
    HlmIconDirective,
    RouterLink,
    HlmButtonDirective,
    HlmFormFieldModule,
    HlmFormFieldComponent,
    FormsModule,
    NgIcon,
  ],
  templateUrl: './add-friend-page.component.html',
  styleUrl: './add-friend-page.component.css',
  providers: [
    provideIcons({
      iconoirSearch,
      iconoirArrowLeft
    })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddFriendPageComponent {
  userStore = inject(userStore)

  onSubmit(form: any){
    if(form){
      console.log(form.value.searchQuery)
      this.userStore.findUsers
    }
  }

  test(arg: string){
    console.log(arg)
  }

}
