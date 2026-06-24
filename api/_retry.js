export async function withRetry(fn, { retries = 2, delayMs = 500 } = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn()
    } catch (err) {
      const isTransient = /premature close|fetch failed|ECONNRESET|ETIMEDOUT/i.test(err?.message ?? '')
      if (!isTransient || attempt >= retries) throw err
      await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)))
    }
  }
}
