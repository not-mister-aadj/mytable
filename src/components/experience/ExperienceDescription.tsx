interface ExperienceDescriptionProps {
  title: string;
  description: string;
}

export function ExperienceDescription({
  title,
  description,
}: ExperienceDescriptionProps) {
  return (
    <section className="py-8 sm:py-14 lg:py-20">
      <h2 className="font-serif text-2xl font-medium tracking-tight text-wine sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 max-w-3xl text-base leading-relaxed text-wine/75 sm:mt-6 sm:text-lg">
        {description}
      </p>
    </section>
  );
}
