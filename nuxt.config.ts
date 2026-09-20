// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@pinia/nuxt',
    '@nuxtjs/supabase',
    '@vueuse/nuxt',
    '@nuxt/image',
  ],

  alias: {
    '@features': import.meta.dirname + '/app/features',
    '@shared': import.meta.dirname + '/app/shared'
  },

  runtimeConfig: {
    supabase: {
      secretKey: process.env.SUPABASE_KEY,
    },
    giphyKey: process.env.GIPHY_KEY,
  },

  components: [
    {
      path: '~/shared/ui',
      extensions: ['.vue'],
    },
  ],

  experimental: {
    componentIslands: true,
    watcher: 'builder',
  },

  nitro: {
    preset: 'netlify'
  },

  supabase: {
    key: process.env.SUPABASE_KEY,
    url: process.env.SUPABASE_URL,

    types: import.meta.dirname + "/app/shared/types/database.types.ts",

    cookieOptions: {
      path: '/',
      maxAge: 60 * 60 * 8,
      sameSite: 'lax',
      secure: false,
    },

    redirectOptions: {
      login: "/",
      callback: "/confirm",
      exclude: ["/login", "/register", "/confirm", "/server-error", "/chat/.*", "/__repro", "/invite/.*", "/forgot-password", "/reset-password"]
    }
  },

  image: {
    supabase: {
      baseURL: `${process.env.SUPABASE_URL}/storage/v1/render/image/public/<bucket-name>`
    },
    domains: [
      process.env.SUPABASE_URL || "",
    ]
  },

  devtools: {
    enabled: true,

    timeline: {
      enabled: true,
    },
  },

  css: ['~/assets/css/main.css'],

  routeRules: {
    '/': { prerender: true }
  },

  icon: {
    mode: 'svg',

    customCollections: [
      {
        prefix: 'chattr',
        dir: './app/assets/icons/',
        recursive: true,
        normalizeIconName: true,
      }
    ]
  },

  compatibilityDate: '2025-01-15',
})
