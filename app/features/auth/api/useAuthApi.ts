import { safeValue } from "@shared/utils"
import type {
	AuthChangeEvent,
	Session,
	SignInWithPasswordCredentials,
	SignInWithPasswordlessCredentials,
	SignUpWithPasswordCredentials,
	VerifyOtpParams,
} from "@supabase/supabase-js"

export const useAuthApi = () => {
	const supabase = useSupabaseClient()

	async function signInWithPassword(credentials: SignInWithPasswordCredentials) {
		return await supabase.auth.signInWithPassword(credentials)
	}

	async function signUp(credentials: SignUpWithPasswordCredentials) {
		return await supabase.auth.signUp(credentials)
	}

	async function signInWithOtp(credentials: SignInWithPasswordlessCredentials) {
		return await supabase.auth.signInWithOtp(credentials)
	}

	async function verifyOtp(params: VerifyOtpParams) {
		return await supabase.auth.verifyOtp(params)
	}

	async function resetPasswordForEmail(email: string, redirectTo?: string) {
		return await supabase.auth.resetPasswordForEmail(
			email,
			redirectTo ? { redirectTo } : undefined,
		)
	}

	async function updatePassword(password: string) {
		return await supabase.auth.updateUser({ password })
	}

	async function signOut() {
		return await supabase.auth.signOut()
	}

	async function getSession() {
		return await supabase.auth.getSession()
	}

	function onAuthStateChange(
		callback: (event: AuthChangeEvent, session: Session | null) => void,
	) {
		return supabase.auth.onAuthStateChange(callback)
	}

	async function findUserProfileByUsername(username: string) {
		return await supabase
			.from("user_profiles")
			.select("*")
			.ilike("username", safeValue(username))
			.single()
	}

	async function findUserProfileByEmail(email: string) {
		return await supabase
			.from("user_profiles")
			.select("*")
			.ilike("email", safeValue(email))
			.single()
	}

	function getAuthClient() {
		return supabase.auth
	}

	return {
		signInWithPassword,
		signUp,
		signInWithOtp,
		verifyOtp,
		resetPasswordForEmail,
		updatePassword,
		signOut,
		getSession,
		onAuthStateChange,
		findUserProfileByUsername,
		findUserProfileByEmail,
		getAuthClient,
	}
}
