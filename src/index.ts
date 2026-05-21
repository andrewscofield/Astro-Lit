import { readFileSync } from 'node:fs'
import type { AstroIntegration, ContainerRenderer } from 'astro'

const LIT_SSR_PACKAGES = [
  'lit',
  'lit/decorators.js',
  'lit-element',
  '@lit/reactive-element',
  '@lit-labs/ssr',
  '@lit-labs/ssr-dom-shim',
  '@semantic-ui/astro-lit',
] as const

function getViteConfiguration() {
  return {
    optimizeDeps: {
      include: [
        '@semantic-ui/astro-lit/dist/client.js',
        '@semantic-ui/astro-lit/client-shim.js',
        '@semantic-ui/astro-lit/hydration-support.js',
        '@webcomponents/template-shadowroot/template-shadowroot.js',
        '@lit-labs/ssr-client/lit-element-hydrate-support.js',
      ],
      exclude: ['@semantic-ui/astro-lit/server.js'],
    },
    ssr: {
      optimizeDeps: {
        exclude: [...LIT_SSR_PACKAGES],
      },
      external: [...LIT_SSR_PACKAGES],
    },
  }
}

export function getContainerRenderer(): ContainerRenderer {
  return {
    name: '@semantic-ui/astro-lit',
    serverEntrypoint: '@semantic-ui/astro-lit/server.js',
  }
}

export default function (): AstroIntegration {
  return {
    name: '@semantic-ui/astro-lit',
    hooks: {
      'astro:config:setup': ({ updateConfig, addRenderer, injectScript }) => {
        // Inject the necessary polyfills on every page (inlined for speed).
        injectScript(
          'head-inline',
          readFileSync(new URL('../client-shim.min.js', import.meta.url), {
            encoding: 'utf-8',
          }),
        )
        // Inject the hydration code, before a component is hydrated.
        injectScript(
          'page',
          `import '@semantic-ui/astro-lit/hydration-support.js';`,
        )
        // Add the lit renderer so that Astro can understand lit components.
        addRenderer({
          name: '@semantic-ui/astro-lit',
          serverEntrypoint: '@semantic-ui/astro-lit/server.js',
          clientEntrypoint: '@semantic-ui/astro-lit/dist/client.js',
        })
        // Update the vite configuration.
        updateConfig({
          vite: getViteConfiguration(),
        })
      },
      'astro:build:setup': ({ vite, target }) => {
        if (target === 'server') {
          if (!vite.ssr) {
            vite.ssr = {}
          }
          if (!vite.ssr.noExternal) {
            vite.ssr.noExternal = []
          }
          if (Array.isArray(vite.ssr.noExternal)) {
            vite.ssr.noExternal.push('lit')
          }
        }
      },
    },
  }
}
