export async function POST() {
  return Response.json({
    answer:
      "Aira is currently running in fresh-start demo mode. The OpenRouter streaming endpoint will be wired in after the UI and data contract are locked.",
    citations: [
      {
        label: "CBSE 2025 Physics · Set-1 · Q12 · 5m",
        source: "demo",
      },
    ],
  });
}
