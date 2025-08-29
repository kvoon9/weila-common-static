<script setup>
// import { onMounted } from 'vue'
// import * as pdf from 'pdfjs-dist/web/pdf_viewer.mjs'
import { VuePDF, usePDF } from '@tato30/vue-pdf'

const { pdf, pages } = usePDF('/license.pdf')
// onMounted(async () => {

//   // const pdf = await import('pdfjs-dist').then(i => i.default)

//   // document.addEventListener('DOMContentLoaded', async () => {
//     // const pdf = globalThis.pdfjsLib
//     pdf.GlobalWorkerOptions.workerSrc = '../vender/pdf.mjs';

//     const doc = await pdf.getDocument('/license.pdf').promise
//     const page = await doc.getPage(1)

//     const canvas = document.querySelector<HTMLCanvasElement>('#canvas')
//     const viewport = page.getViewport()

//     if(!canvas)
//       return
//     const canvasContext = canvas.getContext('2d')

//     if(!canvasContext)
//       return

//     page.render({
//       canvas,
//       canvasContext,
//       viewport,
//     })
//   // })
// })
</script>

<template>
  <!-- <canvas id="canvas" w100vw h100vh> -->
     <!-- <VuePDF w100vw h100vh :pdf="pdf" /> -->
    <div v-for="page in pages" :key="page">
    <VuePDF :pdf="pdf" :page="page" />
  </div>
  <!-- </canvas> -->
</template>
