import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getExchange, type ExchangeDetail } from '@/services/exchanges'

export function useExchangePage() {
  const route = useRoute()
  const exchangeId = computed(() => String(route.params.id))
  const exchange = ref<ExchangeDetail | null>(null)
  const loading = ref(true)
  const notFound = ref(false)
  const loadError = ref('')

  async function load() {
    loading.value = true
    loadError.value = ''
    notFound.value = false
    try {
      const result = await getExchange(exchangeId.value)
      if (!result) {
        notFound.value = true
        exchange.value = null
        return
      }
      exchange.value = result
    } catch (e) {
      loadError.value = e instanceof Error ? e.message : "Couldn't load this exchange."
    } finally {
      loading.value = false
    }
  }

  onMounted(load)

  return { exchangeId, exchange, loading, notFound, loadError, load }
}
