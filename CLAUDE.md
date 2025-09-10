# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build production site to `./dist/`
- `pnpm preview` - Preview production build locally
- `pnpm lint` - Run ESLint checks
- `pnpm lint:fix` - Fix ESLint issues automatically
- `pnpm zip` - Create zip package from dist folder with timestamp

## Architecture Overview

This is an **Astro** static site generator project with **Vue 3** components and **UnoCSS** for styling. The site serves static content for Weila applications including:

- App download pages with QR codes
- Privacy policy documents (Markdown)
- Service agreements (Markdown) 
- License PDF generation and preview

### Key Technologies
- **Astro 5.x** - Static site generator
- **Vue 3** - Component framework via `@astrojs/vue`
- **UnoCSS** - Atomic CSS framework with custom presets
- **ESLint** - Code linting with Antfu's config
- **TypeScript** - Type safety with Astro's strict config

### Project Structure
- `src/pages/` - Astro pages and Markdown content
- `src/components/` - Vue components (PDF previewer, QR generator)
- `src/layouts/` - Astro layout components
- `src/shared/` - Shared constants and utilities
- `src/vender/` - Vendor files (excluded from linting)

### Important Files
- `astro.config.ts` - Astro configuration with Vue integration and proxy setup
- `uno.config.ts` - UnoCSS configuration with custom shortcuts and presets
- `eslint.config.js` - ESLint configuration using Antfu's preset
- `scripts/zip.ts` - Build packaging script using zx

### Deployment
- Site is configured with base path `/common`
- Production site URL: `https://demoui.weila.hk/common`
- Development proxy setup for `/v1` and `/v2` API endpoints

### Notable Features
- PDF generation and preview capabilities
- QR code generation for app downloads
- Markdown content rendering
- Responsive design with UnoCSS utilities
- Vue components integrated with Astro