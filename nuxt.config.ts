import tailwindcss from "@tailwindcss/vite";
import Aura from '@primeuix/themes/aura';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  css: [
    '~/assets/css/main.css'
  ],
  postcss: {
    plugins: {
      autoprefixer: {},
    },
  },
  modules:[ 
    '@pinia/nuxt',
    '@primevue/nuxt-module',
  ],
  primevue:{
    options: {
      theme: {
          preset: Aura,
      }
  }
  },
  build:{
    transpile: ['primevue'],
  },
  runtimeConfig:{
    public:{
      apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:8000',
    }
  },
  vite: {
    plugins:[
      tailwindcss(),
    ],
  },
  plugins:[
    '~/plugins/primevue.js',
  ]
})
