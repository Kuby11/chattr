import { ROUTE_TOKENS } from "@shared/configs"
import type { AuthChangeEvent, Session } from "@supabase/supabase-js"
import { useAuthApi } from "../api/useAuthApi"

export const useAuth = () => {
  const authApi = useAuthApi()

  async function signIn({ email, password, options }: {
    email: string
    password: string
    options?: {
      redirectTo?: string
      captchaToken?: string
    }
  }) {
    const { data, error } = await authApi.signInWithPassword({
      email,
      password,
      options,
    })

    if (error) {
      if (error.code === "invalid_credentials")
        throw Error("invalid password or email!")

      throw error
    }

    if (options?.redirectTo) {
      const session = data.session ?? (await authApi.getSession()).data.session

      if (!session) throw new Error('Session could not be established')

      await nextTick()
      return await navigateTo(options.redirectTo)
    }

    return { data, error }
  }

  async function signOut() {
    await authApi.signOut()
    return navigateTo(ROUTE_TOKENS.LOGIN)
  }

  async function signUp({ email, password, username, nickname, options }: {
    email: string
    password: string
    username: string
    nickname: string
    options?: {
      captchaToken?: string
      channel?: 'sms' | 'whatsapp'
      redirectTo?: string
      emailRedirectTo?: string
    }
  }) {
    const foundUserProfileByUsername = await authApi.findUserProfileByUsername(username)

    if (foundUserProfileByUsername.data)
      throw new Error("user with this username already exists")

    if (foundUserProfileByUsername.error && foundUserProfileByUsername.error?.code !== "PGRST116")
      throw foundUserProfileByUsername.error?.message

    const foundUserProfileByEmail = await authApi.findUserProfileByEmail(email)

    if (foundUserProfileByEmail.data)
      throw new Error("user with this email already exists")

    if (foundUserProfileByEmail.error && foundUserProfileByEmail.error?.code !== "PGRST116")
      throw foundUserProfileByEmail.error?.message

    const { data, error } = await authApi.signUp({
      email,
      password,
      options: {
        ...options,
        data: {
          username,
          nickname,
          email,
        },
      },
    })

    if (error) throw error
    if (options?.redirectTo) await navigateTo(options.redirectTo)

    return { data, error }
  }

  async function verifyOtp({ email, token, redirectTo }: {
    email: string
    token: string
    redirectTo?: string
  }) {
    const { data, error } = await authApi.verifyOtp({
      email,
      token,
      type: 'signup',
    })

    if (error) throw error

    if (redirectTo) {
      const { data: { session } } = await authApi.getSession()

      if (!session) throw new Error('Session could not be established')

      await navigateTo(redirectTo)
    }

    return { data, error }
  }

  async function verifyRecoveryOtp({ email, token }: {
    email: string
    token: string
  }) {
    const { data, error } = await authApi.verifyOtp({
      email,
      token,
      type: 'recovery',
    })

    if (error) throw error

    return { data, error }
  }

  async function resetPassword({ email }: {
    email: string
  }) {
    const redirectTo = `${window.location.origin}${ROUTE_TOKENS.RESET_PASSWORD}`
    const { data, error } = await authApi.resetPasswordForEmail(email, redirectTo)

    if (error) throw error

    return { data, error }
  }

  async function updatePassword(password: string) {
    const { data, error } = await authApi.updatePassword(password)

    if (error) throw error

    return { data, error }
  }

  function onAuthStateChange(
    callback: (event: AuthChangeEvent, session: Session | null) => void,
  ) {
    const { data: { subscription } } = authApi.onAuthStateChange(callback)

    onScopeDispose(() => subscription.unsubscribe())
  }

	return {
		signIn,
		signUp,
		signOut,
		resetPassword,
		verifyOtp,
		verifyRecoveryOtp,
		updatePassword,
		onAuthStateChange,
		supabaseAuth: authApi.getAuthClient(),
	}
}
