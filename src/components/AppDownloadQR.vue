<script setup lang="ts">
import { useQRCode } from '@vueuse/integrations/useQRCode'
import { WeilaApi } from '@weila/network'
import { normalizeURL, parseURL, parseQuery } from 'ufo'
import { computed, onMounted, shallowRef } from 'vue'
import { appid, appkey } from '~/shared/const'

// enum AppDownloadLinkType {
//   CorpDemo = 'corp-demo',
//   CorpNormal = 'corp-normal',
//   WeilaDemo = 'weila-demo',
//   WeilaNormal = 'weila-normal',
// }

const data = shallowRef<{ url: string, avatar: string } | undefined>(undefined)

const url = computed(() => normalizeURL(data.value?.url || ''))
const qrcode = useQRCode(url)

onMounted(async () => {
  const backBtn = document.getElementById('back-btn')
  backBtn?.addEventListener('click', () => {
    window.history.back()
  })

  const {
    type = 'weila-normal'
  } = parseQuery<{ type: string }>(parseURL(window.location.href).search)

  const api = new WeilaApi(appid, appkey)
  data.value = await api.v2.fetch('common/app-download', {
    body: {
      type,
    },
  })
})
</script>

<template>
  <div h-full grid="~ rows-[min-content_1fr]">
    <nav text-center relative p4 border="b neutral-300">
      <button absolute left-2 id="back-btn">
        返回
      </button>

      软件下载
    </nav>
    <div v-if="!data" text-center mt30>
      加载数据中...
    </div>
    <section v-else of-auto>
      <div class="p-6 text-center font-sans space-y-6">
        <header class="text-3xl font-thin leading-loose">
          企业集群通，微喇来提供
        </header>
        <main class="space-y-4">
          <div relative>
            <img border="~ 1 neutral-300" class="mx-auto  rounded-lg w-[1/2] lg:w-60 " :src="qrcode" alt="QR Code">
            <img v-if="data?.avatar" absolute position-center bg-white :src="data.avatar" w8 h8 rounded p0.5>
          </div>
          <button class="inline-flex items-center space-x-2 gap-2 rounded-full bg-primary px-4 py-2 text-lg text-white opacity-85 hover:opacity-100">
            <Icon name="ph:android-logo-duotone" class="size-8" />
            <a :href="url">
              Android APP
            </a>
          </button>
        </main>
      </div>
    </section>
  </div>
</template>
