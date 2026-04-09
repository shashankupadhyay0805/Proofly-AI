import Tesseract from 'tesseract.js';

export async function extractTextFromImageBuffer(imageBuffer) {
  if (!imageBuffer) {
    const err = new Error('Missing image');
    err.status = 400;
    throw err;
  }

  const {
    data: { text, confidence },
  } = await Tesseract.recognize(imageBuffer, 'eng', {
    logger: () => {},
  });

  return {
    text: String(text || '').trim(),
    confidence: typeof confidence === 'number' ? confidence : null,
  };
}

