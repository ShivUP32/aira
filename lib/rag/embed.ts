const HF_MODEL = 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2';
const HF_API_URL = `https://api-inference.huggingface.co/pipeline/feature-extraction/${HF_MODEL}`;

export async function embedQuery(text: string): Promise<number[]> {
  const token = process.env.HF_API_TOKEN;
  if (!token) {
    throw new Error('HF_API_TOKEN is not set');
  }

  const response = await fetch(HF_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: text,
      options: { wait_for_model: true },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HuggingFace API error: ${response.status} ${error}`);
  }

  const data = await response.json();

  // HF returns nested arrays for batched inputs; we send a single string
  // so result is float[] or float[][]
  if (Array.isArray(data) && typeof data[0] === 'number') {
    return data as number[];
  }

  if (Array.isArray(data) && Array.isArray(data[0])) {
    return data[0] as number[];
  }

  throw new Error('Unexpected embedding response shape');
}
