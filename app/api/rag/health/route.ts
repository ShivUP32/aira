export async function GET() {
  return Response.json({
    status: "demo",
    documents: 0,
    message: "RAG pipeline contract is present; Supabase upload comes next.",
  });
}
