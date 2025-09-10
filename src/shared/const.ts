// export const appid = '102036'
// export const appkey = 'b3c658bd2e637c65efb134fb381d4a18'

import { computed } from "vue"

export const appid = computed(() => {
  if(import.meta.env.DEV)
    return '102036'
  else
    return '102065'
})

export const appkey = computed(() => {

  return import.meta.env.DEV
? 'b3c658bd2e637c65efb134fb381d4a18'
: '3c227f2cbc2084ebdd9617fd283c42c7'
})
