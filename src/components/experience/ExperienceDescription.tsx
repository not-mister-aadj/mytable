interface ExperienceDescriptionProps {
  title: string;
  description: string;
}

export function ExperienceDescription({
  title,
  description,
}: ExperienceDescriptionProps) {
  return (
    <section className="py-14 sm:py-20">
      <h2 className="font-serif text-3xl font-medium tracking-tight text-wine sm:text-4xl">
        {title}
      </h2>
      <p className="mt-6 max-w-3xl text-lg leading-relaxed text-wine/75">
        {description}
      </p>
    </section>
  );
}
