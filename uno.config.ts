import { defineConfig, presetAttributify, presetIcons, presetTypography, presetWebFonts, presetWind4, transformerDirectives, transformerVariantGroup } from 'unocss'

export default defineConfig({
  shortcuts: [
    ['flex-center', 'justify-center items-center'],
    ['list-btn', 'hover:bg-op100 hover:bg-gray-200 dark:hover:bg-#343435 w-full rounded px4 py2 text-start leading-loose bg-op75 transition-all duration-80 active:color-primary visited:color-primary flex items-center gap-2'],
    ['bg-base', 'bg-white dark:bg-dark'],
    ['text-base', 'text-gray-800 dark:text-white'],
    ['position-center', 'position-x-center position-y-center'],
    ['position-x-center', 'left-50% translate-x--50%'],
    ['position-y-center', 'top-50%  translate-y--50%'],
    ['icon-btn', 'inline-block cursor-pointer select-none opacity-75 transition duration-200 ease-in-out hover:opacity-100 hover:text-teal-600'],
  ],
  presets: [
    presetWind4({
      preflights: {
        reset: true,
      },
    }),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
    }),
    presetTypography(),
    presetWebFonts({
      fonts: {
        sans: 'DM Sans',
        serif: 'Noto Serif Simplified Chinese',
        mono: 'DM Mono',
      },
    }),
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],
})
