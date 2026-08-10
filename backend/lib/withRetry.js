async function withRetry(fn, { retries = 3, baseDelayMs = 300 } = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const statusCode = error.statusCode || error.status;
      const retryable = statusCode === 429 || (statusCode >= 500 && statusCode < 600);

      if (!retryable || attempt >= retries) {
        throw error;
      }

      const delay = baseDelayMs * 2 ** attempt + Math.random() * 100;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

module.exports = withRetry;
