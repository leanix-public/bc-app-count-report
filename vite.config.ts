import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import leanix from 'vite-plugin-lxr'
import graphql from '@rollup/plugin-graphql'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), leanix(), graphql()]
})
