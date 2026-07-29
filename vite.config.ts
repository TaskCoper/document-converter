import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, type Plugin } from "vite";

// Mã định danh của mỗi lần build. Trên Vercel lấy commit SHA để build lại cùng một
// commit ra cùng một id (không bắt client reload vô cớ); ở local thì lấy mốc thời gian.
const BUILD_ID =
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ??
  process.env.GITHUB_SHA?.slice(0, 12) ??
  Date.now().toString(36);

// Ghi /version.json vào dist. Client poll file này để biết đã có bản deploy mới —
// index.html không dùng được vì tên các asset đều đã băm và nội dung HTML có thể
// không đổi giữa hai lần build.
function versionManifest(): Plugin {
  return {
    name: "vnz-version-manifest",
    apply: "build",
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "version.json",
        source: JSON.stringify({ buildId: BUILD_ID }),
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  define: {
    __BUILD_ID__: JSON.stringify(BUILD_ID),
  },
  plugins: [
    versionManifest(),
    react(),
    tailwindcss(),
    babel({
      presets: [
        reactCompilerPreset({
          sources: (filename: string) =>
            !/-section\.tsx$|-form-sections\.tsx$/.test(filename),
        }),
      ],
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 3000,
  },
});
