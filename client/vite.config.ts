import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd())

    const PORT = parseInt(`${env.VITE_PORT}`) ?? 8000

    return {
        preview: {
            port: PORT,
            host: true,
        },
        server: {
            port: PORT,
            host: true,
        },
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "./src"),
            },
        },
        plugins: [react()],
    }
})
