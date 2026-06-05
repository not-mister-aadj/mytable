export type LegalBlock =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] };

export type LegalSection = {
  title: string;
  blocks: LegalBlock[];
  subsections?: LegalSection[];
};

export type LegalDocumentContent = {
  metaTitle: string;
  title: string;
  updatedLabel: string;
  sections: LegalSection[];
};
