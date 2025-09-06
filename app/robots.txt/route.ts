export function GET() {
  return new Response(
`User-agent: *
Disallow: /admin`,
    { headers: { 'Content-Type': 'text/plain' } }
  );
}
