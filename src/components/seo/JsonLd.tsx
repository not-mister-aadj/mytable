type JsonLd = Record<string, unknown>;

/** Renders one or more schema.org JSON-LD blocks for Google rich results. */
export function JsonLd({
  data,
}: {
  data: JsonLd | Array<JsonLd | null | undefined> | null | undefined;
}) {
  if (!data) return null;
  const blocks = (Array.isArray(data) ? data : [data]).filter(
    (block): block is JsonLd => Boolean(block),
  );
  if (blocks.length === 0) return null;

  return (
    <>
      {blocks.map((block, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
    </>
  );
}
