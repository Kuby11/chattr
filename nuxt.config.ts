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

  components: [
    {
      path: '~/shared/ui',
      extensions: ['.vue'],
    },
  ],

  experimental: {
    componentIslands: true,
  },

  nitro: {
    preset: 'bun'
  },

  runtimeConfig: {
    public: {
      giphyKey: import.meta.env["GIPHY_KEY"] ?? "",
    },
  },

  supabase: {
    key: import.meta.env["SUPABASE_KEY"],
    url: import.meta.env["SUPABASE_URL"],

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
      exclude: ["/login", "/register", "/confirm", "/server-error", "/chat/.*", "/__repro", "/invite/.*"]
    }
  },

  image: {
    supabase: {
      baseURL: `${import.meta.env["SUPABASE_URL"]}/storage/v1/render/image/public/<bucket-name>`
    }
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
