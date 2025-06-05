import { FormControl, FormGroup } from "@angular/forms";

export type FormType = FormGroup<{
	username: FormControl<string>;
	email: FormControl<string>;
	password: FormControl<string>;
}> 
