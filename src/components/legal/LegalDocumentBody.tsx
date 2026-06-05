import type { LegalBlock, LegalSection } from "@/i18n/legal-types";
import {
  getCompanyLegalVars,
  interpolateLegal,
  type CompanyLegalVars,
} from "@/lib/company-legal";

function renderBlock(block: LegalBlock, vars: CompanyLegalVars) {
  if (block.type === "ul") {
    return (
      <ul className="mt-3 list-disc space-y-2 pl-5 text-wine/80">
        {block.items.map((item) => (
          <li key={item}>{interpolateLegal(item, vars)}</li>
        ))}
      </ul>
    );
  }

  const paragraphs = interpolateLegal(block.text, vars).split("\n");
  return (
    <div className="mt-3 space-y-3 text-wine/80">
      {paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </div>
  );
}

function LegalSectionBlock({
  section,
  vars,
  level = 2,
}: {
  section: LegalSection;
  vars: CompanyLegalVars;
  level?: 2 | 3;
}) {
  const Heading = level === 2 ? "h2" : "h3";
  const headingClass =
    level === 2
      ? "font-serif text-2xl font-medium text-wine sm:text-3xl"
      : "mt-6 font-serif text-xl font-medium text-wine";

  return (
    <section className={level === 2 ? "border-t border-border-subtle pt-10 first:border-t-0 first:pt-0" : ""}>
      <Heading className={headingClass}>{interpolateLegal(section.title, vars)}</Heading>
      {section.blocks.map((block, index) => (
        <div key={`${section.title}-block-${index}`}>{renderBlock(block, vars)}</div>
      ))}
      {section.subsections?.map((subsection) => (
        <LegalSectionBlock
          key={subsection.title}
          section={subsection}
          vars={vars}
          level={3}
        />
      ))}
    </section>
  );
}

export function LegalDocumentBody({
  sections,
  locale,
}: {
  sections: LegalSection[];
  locale: "nl" | "en";
}) {
  const vars = getCompanyLegalVars(locale);

  return (
    <div className="space-y-10">
      {sections.map((section) => (
        <LegalSectionBlock key={section.title} section={section} vars={vars} />
      ))}
    </div>
  );
}
