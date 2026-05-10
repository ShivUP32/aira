export async function GET() {
  return Response.json({ conversation: { id: "demo", title: "Demo chat" }, messages: [] });
}

export async function DELETE() {
  return Response.json({ success: true });
}
