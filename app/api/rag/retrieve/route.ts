export async function POST() {
  return Response.json({
    results: [
      {
        content: "Demo retrieval result for Lenz's law.",
        metadata: {
          subject: "physics",
          year: 2025,
          set_label: "Set-1",
          q_no: 12,
          marks: 5,
          solution_source: "marking-scheme",
        },
      },
    ],
  });
}
