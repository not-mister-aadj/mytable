interface ValueStripProps {
  items: string[];
}

export function ValueStrip({ items }: ValueStripProps) {
  return (
    <section className="border-y border-border-subtle bg-beige/60 py-10 sm:py-12">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {items.map((item) => (
            <li key={item} className="text-center lg:text-left">
              <div className="mx-auto mb-3 h-px w-8 bg-gold lg:mx-0" />
              <h3 className="font-serif text-lg font-medium text-wine sm:text-xl">
                {item}
              </h3>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
