import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const API_TARGETS = {
  '/api/auth-api': 'http://i3e27gyvy06z7bmztg4nz32cnz3b05bn.lambda-url.us-east-1.localhost.localstack.cloud:4566',
  '/api/employee-api': 'http://n3o3ef9z8rekbuo989uclbl6zfd62iye.lambda-url.us-east-1.localhost.localstack.cloud:4566',
  '/api/review-api': 'http://nck2t0ry8iu9to9c4xzsqakzcxh66vlq.lambda-url.us-east-1.localhost.localstack.cloud:4566',
  '/api/analytics-api': 'http://2s4obl1fdc5tclyxblwp8y9fiib34s23.lambda-url.us-east-1.localhost.localstack.cloud:4566',
}

function apiProxyPlugin() {
  return {
    name: 'custom-api-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const matchedPrefix = Object.keys(API_TARGETS).find((prefix) =>
          req.url?.startsWith(prefix)
        )

        if (!matchedPrefix) {
          return next()
        }

        try {
          const targetBase = API_TARGETS[matchedPrefix]
          const targetPath = req.url.replace(/^\/api/, '')
          const targetUrl = `${targetBase}${targetPath}`

          const bodyChunks = []
          for await (const chunk of req) {
            bodyChunks.push(chunk)
          }
          const bodyBuffer = Buffer.concat(bodyChunks)

          const headers = {
            'content-type': req.headers['content-type'] || 'application/json',
          }

          if (req.headers.authorization) {
            headers.authorization = req.headers.authorization
          }

          const response = await fetch(targetUrl, {
            method: req.method,
            headers,
            body:
              req.method === 'GET' || req.method === 'HEAD'
                ? undefined
                : bodyBuffer,
          })

          res.statusCode = response.status

          const contentType = response.headers.get('content-type')
          if (contentType) {
            res.setHeader('Content-Type', contentType)
          }

          const text = await response.text()
          res.end(text)
        } catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              detail: error.message || 'Proxy request failed',
            })
          )
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), apiProxyPlugin()],
  server: {
    port: 3000,
    strictPort: true,
  },
})