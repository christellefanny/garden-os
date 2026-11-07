// Browser QA must never contact real application services or send telemetry.
export async function isolateBrowserContext(context) {
  await context.route(/^https?:\/\//, route => {
    const hostname = new URL(route.request().url()).hostname;
    return ['127.0.0.1', 'localhost', '[::1]'].includes(hostname)
      ? route.continue()
      : route.abort('blockedbyclient');
  });
}
