/**
 * Renders a JSON-LD <script> for structured data (the Next-recommended pattern).
 * Content is our own data, serialized with JSON.stringify — safe to inline.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
