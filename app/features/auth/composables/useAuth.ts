import { ROUTE_TOKENS } from "@shared/configs"
import { safeValue } from "@shared/utils"

export const useAuth = () => {
  const supabase = useSupabaseClient()

  async function signIn({email, password, options}: {
    email: string
    password: string
    options?: {
      redirectTo?: string
      captchaToken?: string
    }
  }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options
    })

    if (error) {
      if(error.code === "invalid_credentials")
        throw Error("invalid password or email!")

      throw error
    }

    if (options?.redirectTo) {
      const session = data.session ?? (await supabase.auth.getSession()).data.session

      if (!session) throw new Error('Session could not be established')

      await nextTick()
      return await navigateTo(options.redirectTo)
    }

    return { data, error }
  }

  async function signOut() {
    await supabase.auth.signOut()
    return navigateTo(ROUTE_TOKENS.LOGIN)
  }

  async function signUp({email, password, username, nickname, options}: {
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
    const findUserProfileByUsername = await supabase
      .from("user_profiles")
      .select("*")
      .ilike("username", safeValue(username))
      .single()

    if(findUserProfileByUsername.data)
      throw new Error("user with this username already exists")
		
    if(findUserProfileByUsername.error && findUserProfileByUsername.error?.code !== "PGRST116" )
      throw findUserProfileByUsername.error?.message

    const findUserProfileByEmail = await supabase
      .from("user_profiles")
      .select("*")
      .ilike("email", safeValue(email))
      .single()

    if(findUserProfileByEmail.data)
      throw new Error("user with this email already exists")
    
    if(findUserProfileByEmail.error && findUserProfileByEmail.error?.code !== "PGRST116" )
      throw findUserProfileByEmail.error?.message

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        ...options,
        data: {
          username,
          nickname,
          email
        }
      }
    })

    if (error) throw error
    if (options?.redirectTo) await navigateTo(options.redirectTo)

    return { data, error }
  }

  async function verifyOtp({email, token, redirectTo}: {
    email: string
    token: string
    redirectTo?: string
  }) {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup'
    })

    if (error) throw error

    if (redirectTo) {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) throw new Error('Session could not be established')
      
      await navigateTo(redirectTo)
    }

    return { data, error }
  }

  function onAuthStateChange(callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]){        
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session)
    })

    onScopeDispose(() => subscription.unsubscribe())
  }

  return {
    signIn,
    signUp,
    signOut,
    verifyOtp,
    onAuthStateChange,
    supabaseAuth: supabase.auth
  }
}
