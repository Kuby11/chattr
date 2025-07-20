import { ChangeDetectionStrategy, Component, inject, OnInit, signal,} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HlmAvatarComponent, HlmAvatarFallbackDirective, HlmAvatarImageDirective } from '@spartan-ng/ui-avatar-helm';
import { DatePipe } from '@angular/common';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { BrnDialogContentDirective, BrnDialogTriggerDirective } from '@spartan-ng/brain/dialog';
import {
  HlmDialogComponent,
  HlmDialogContentComponent,
  HlmDialogHeaderComponent,
} from '@spartan-ng/ui-dialog-helm';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HlmFormFieldComponent, HlmHintDirective } from '@spartan-ng/ui-formfield-helm';
import { HlmErrorDirective } from "../../../../libs/src/ui/ui-formfield-helm/src/lib/hlm-error.directive";
import { HlmToasterComponent } from '@spartan-ng/ui-sonner-helm';
import { toast } from 'ngx-sonner';
import { currentPageService } from '../../shared/services/current-page.service';
import { AuthService } from '../../features/auth/services/auth.service';
import { ProfileService, Profile } from '../../entities/profile';
import { UserService, userStore } from '../../entities/user';


@Component({
  selector: 'app-profile',
  imports: [
    ReactiveFormsModule,
    HlmAvatarComponent,
    HlmAvatarFallbackDirective,
    HlmAvatarImageDirective,
    HlmButtonDirective,
    HlmInputDirective,
    HlmDialogComponent,
    HlmDialogContentComponent,
    HlmDialogHeaderComponent,
    BrnDialogContentDirective,
    BrnDialogTriggerDirective,
    HlmFormFieldComponent,
    HlmInputDirective,
    HlmHintDirective,
    HlmErrorDirective,
    DatePipe,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
  providers: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit {
  private readonly currentPageService = inject(currentPageService);
  private readonly userService = inject(UserService);
  private readonly profileService = inject(ProfileService);
  private readonly authService = inject(AuthService) 
  private readonly fb = inject(FormBuilder);
  private readonly activatedRoute = inject(ActivatedRoute);
  
  userStore = inject(userStore);  
  profileData = signal<Profile | null>(null);
  routeData = this.activatedRoute.data;
  
  currentUserId = this.userStore.currentUser()?.id;
  isCurrentUser = signal<boolean>(false);
  canEdit = signal<boolean>(false);
 
  ngOnInit() {
    this.loadData()
    
    this.activatedRoute.params
    .subscribe((paramData)=>{
      const id = paramData['id'];
      this.loadData()
      if(this.currentUserId === id){
        this.isCurrentUser.set(true);
      }
    })
      
    this.form.valueChanges.subscribe((data) => {
      if (
        data.bio === this.profileData()?.bio &&
        data.displayName === this.profileData()?.displayName
      ) {
        this.canEdit.set(false);
      } else {
        this.canEdit.set(true);
      }
    })
      
    this.currentPageService.setPage(this.userStore.currentUser()?.username + '`s profile');
  }

  form = this.fb.group({
    displayName: [
      this.profileData()?.displayName,
      [Validators.maxLength(30), Validators.minLength(2)],
    ],
    bio: [this.profileData()?.bio, [Validators.maxLength(400)]],
  });

  onSubmit() {
    if(this.canEdit()){
      this.profileService
        .updateProfile(this.userStore.currentUser()!.id, this.form.value as Profile)
        .subscribe();
      if (!this.form.errors) {
        toast.success('successfully edited profile!', {
          action: {
            label: 'hide',
            onClick: () => console.log('hide'),
          },
        });
      }
    }
  }

  logout(){
    this.authService.logout()
  }

  private loadData(){
    this.routeData
    .subscribe((data: any) => {
      this.profileData.set(data['profile']);
      // this.userStore.currentUser.set(data['user']);

      this.form.controls.displayName.setValue((this.profileData())?.displayName);
      this.form.controls.bio.setValue(this.profileData()?.bio);
    });

    this.userService
    .getMe()
    .subscribe((data)=>{
      if (data.id === this.userStore.currentUser()!.id) {
        this.isCurrentUser.set(true);
      }
    });
  }
}
