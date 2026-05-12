export function detectLang(text: string): "en" | "hi" {
  const devanagari = (text.match(/[\u0900-\u097F]/g) || []).length;
  const latin = (text.match(/[a-zA-Z]/g) || []).length;
  return devanagari > latin ? "hi" : "en";
}
