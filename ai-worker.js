let pipe = null;

self.onmessage = async (event) => {
  const { type, id, messages } = event.data || {};
  try {
    if (type === 'init') {
      const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers/+esm');
      env.allowLocalModels = false;
      env.useBrowserCache = true;
      pipe = await pipeline('text-generation', 'onnx-community/SmolLM2-360M-Instruct', {
        dtype: 'q4',
        progress_callback: (report) => self.postMessage({ type: 'progress', report })
      });
      self.postMessage({ type: 'ready' });
      return;
    }
    if (type === 'generate' && pipe) {
      const result = await pipe(messages, {
        max_new_tokens: 320,
        temperature: 0.35,
        do_sample: false,
        repetition_penalty: 1.08,
        return_full_text: false
      });
      const generated = result?.[0]?.generated_text;
      const reply = Array.isArray(generated) ? generated.at(-1)?.content : generated;
      self.postMessage({ type: 'result', id, reply: String(reply || '').trim() });
    }
  } catch (error) {
    self.postMessage({ type: 'error', id, message: String(error?.message || error || 'Local worker error') });
  }
};
