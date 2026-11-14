// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://itschool.ictact.kr',
  output: 'static',
  trailingSlash: 'ignore',
  // /privacy → privacy.html 처럼 파일로 출력해 Workers 자산에서 슬래시 없는 주소로 바로 열리게 한다
  build: { format: 'file' },
});
