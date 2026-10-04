import { watchEffect } from 'vue'
import { useRoute } from 'vue-router'

function setMetaDescription(content: string) {
  let el = document.querySelector('meta[name="description"]')
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', 'description')
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export function usePageMeta() {
  const route = useRoute()

  watchEffect(() => {
    const title = (route.meta.title as string | undefined) ?? 'SantaSwap'
    const description =
      (route.meta.description as string | undefined) ??
      'SantaSwap makes Secret Santa exchanges simple. Create your group, draw names, and share one invite link so everyone can privately see who they are buying for.'

    document.title = title
    setMetaDescription(description)
  })
}
