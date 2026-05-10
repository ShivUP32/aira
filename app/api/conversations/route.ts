export async function GET() {
  return Response.json({ conversations: [] });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return Response.json({ conversation: { id: "demo", ...body } }, { status: 201 });
}
