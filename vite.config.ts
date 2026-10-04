import * as path from 'path';
import type { ResolvedConfig } from 'vite';
import { defineConfig } from 'vite';
export default defineConfig(({ mode }) => {
  let config: ResolvedConfig;

  return {
    oxc: {
      target: 'es2018',
      tsconfigRaw: {
        compilerOptions: {
          verbatimModuleSyntax: false
        }
      }
    },
    build: {
      target: 'es2018',
      outDir: path.resolve(import.meta.dirname, 'build'),
      emptyOutDir: false,
      minify: true,
      sourcemap: true,
      rolldownOptions: {
        external: ['excalibur'],
      },
      lib: {
        formats: ['es'],
        name: 'ex.SpriteFusion',
        fileName(format: any) {
          let fileName = 'excalibur-spritefusion';

          if (config.build.minify) {
            fileName += '.min';
          }

          if (mode === 'development') {
            fileName += '.development';
          }

          if (format === 'es') {
            return `esm/${fileName}.js`;
          }

          return `dist/${fileName}.js`;
        },
        entry: 'src/index.ts'
      }
    },

    plugins: [
      // get the resolved vite config so we can reference it in
      // callbacks
      {
        name: 'get-config',
        configResolved(v: any) {
          config = v;
        }
      }
    ]
  };
});
