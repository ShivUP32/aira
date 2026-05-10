export async function GET() {
  return Response.json({ bookmarks: [] });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return Response.json({ bookmark: body }, { status: 201 });
}
