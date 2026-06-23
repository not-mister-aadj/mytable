interface ValueStripProps {
  items: string[];
}

export function ValueStrip({ items }: ValueStripProps) {
  return (
    <section className="border-y border-border-subtle bg-beige/60 py-6 sm:py-12">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <ul className="grid grid-cols-2 gap-4 sm:gap-8 lg:grid-cols-4 lg:gap-6">
          {items.map((item) => (
            <li key={item} className="text-center lg:text-left">
              <div className="mx-auto mb-2 h-px w-6 bg-gold sm:mb-3 sm:w-8 lg:mx-0" />
              <h3 className="font-serif text-sm font-medium leading-snug text-wine sm:text-lg lg:text-xl">
                {item}
              </h3>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
