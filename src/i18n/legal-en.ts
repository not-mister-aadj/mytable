import type { LegalDocumentContent } from "@/i18n/legal-types";

export const termsEn: LegalDocumentContent = {
  metaTitle: "Terms and conditions",
  title: "Terms and conditions",
  updatedLabel: "Last updated",
  sections: [
    {
      title: "1. Identity of the provider",
      blocks: [
        {
          type: "p",
          text: "{{legalName}}\n{{addressBlock}}\nEmail: {{email}}\nChamber of Commerce (KvK): {{kvk}}\nVAT number: {{btw}}",
        },
        {
          type: "p",
          text: "{{legalName}} organises culinary tables, wine tastings and related food and drink experiences in the Netherlands through {{tradeName}}.",
        },
      ],
    },
    {
      title: "2. Scope of these terms",
      blocks: [
        {
          type: "p",
          text: "These terms apply to:",
        },
        {
          type: "ul",
          items: [
            "bookings for tables, tastings and related events via {{websiteUrl}};",
            "communication directly related to your reservation; and",
            "other purchases we offer through {{website}} or approved sales channels.",
          ],
        },
        {
          type: "p",
          text: "If we publish separate terms for a specific table or campaign, those apply in addition to these general terms.",
        },
      ],
    },
    {
      title: "3. Formation of the agreement",
      blocks: [
        {
          type: "p",
          text: "Information on our website is an invitation to place a reservation, not a binding offer from us.",
        },
        {
          type: "p",
          text: "When you complete checkout, you make an offer to purchase the selected table or event. The agreement is formed once we receive your payment and send you a booking confirmation by email.",
        },
        {
          type: "p",
          text: "We may refuse or cancel an order before it is accepted in case of an obvious pricing error, lack of availability, a payment issue, or reasonable suspicion of abuse or fraud.",
        },
      ],
    },
    {
      title: "4. Prices and payment",
      blocks: [
        {
          type: "p",
          text: "Unless stated otherwise, our prices include VAT where applicable.",
        },
        {
          type: "p",
          text: "Payment is due in full in advance via the payment methods shown at checkout (including iDEAL, card and Bancontact). You are responsible for providing correct contact and payment details.",
        },
        {
          type: "p",
          text: "If a payment is reversed, charged back or otherwise not completed, we may suspend or cancel your reservation until the issue is resolved.",
        },
      ],
    },
    {
      title: "5. Participation at tables and events",
      blocks: [
        {
          type: "p",
          text: "{{tradeName}} evenings take place at carefully selected partner venues. You are responsible for:",
        },
        {
          type: "ul",
          items: [
            "checking table details during checkout and in your confirmation email;",
            "ensuring all guests in your party arrive on time; and",
            "providing dietary requirements or other information we need in good time.",
          ],
        },
        {
          type: "p",
          text: "Alcoholic drinks may only be served to guests who are legally old enough. Partner venues may refuse alcohol where required by law or responsible serving rules.",
        },
        {
          type: "p",
          text: "To run the event, we may share limited guest information with the partner venue, such as the name on the booking, group size and dietary notes.",
        },
        {
          type: "p",
          text: "Photos and video: during {{tradeName}} evenings, photos and videos may be taken by us or photographers and videographers we engage. By completing your payment, you agree that you may appear in material we use for marketing, including our website, social media, email and online advertising.",
        },
        {
          type: "p",
          text: "Prefer not to be clearly on camera? Tell the host or on-site team when you arrive. We will do our best to accommodate that, but we cannot guarantee you will not appear in the background of group or atmosphere shots.",
        },
        {
          type: "p",
          text: "You may always ask us to reasonably adjust or remove specific images on which you are recognisably pictured, via {{email}}. See our privacy policy at {{websiteUrl}}/en/privacy for more.",
        },
      ],
    },
    {
      title: "6. Changes by you",
      blocks: [
        {
          type: "p",
          text: "Cancellation is not possible. You may exchange your booking free of charge to another available date up to {{exchangeDeadlineHours}} hours before the start of the event. Email {{email}} with your reservation details.",
        },
        {
          type: "p",
          text: "After this deadline, exchanges are no longer possible and no refund is due, regardless of the reason.",
        },
        {
          type: "p",
          text: "This deadline applies because we confirm final guest numbers with partner venues in advance so they can plan staffing, purchasing and seating.",
        },
        {
          type: "p",
          text: "Mandatory consumer rights under applicable law remain unaffected.",
        },
      ],
    },
    {
      title: "7. Changes or cancellation by us",
      blocks: [
        {
          type: "p",
          text: "We may make reasonable changes to a table or event where necessary for operational, safety or quality reasons. This may include changes to time, venue within the same city, or a comparable replacement.",
        },
        {
          type: "p",
          text: "If we fully cancel an event or cannot deliver it as agreed, we will offer a rebooking or refund depending on the circumstances.",
        },
        {
          type: "p",
          text: "Where non-performance is caused by circumstances beyond our reasonable control, our liability is limited to what the law requires.",
        },
      ],
    },
    {
      title: "8. Complaints and support",
      blocks: [
        {
          type: "p",
          text: "If something goes wrong, contact us as soon as possible at {{email}} so we can investigate and help.",
        },
        {
          type: "p",
          text: "Please include your reservation code, the event date and a brief description of the issue.",
        },
      ],
    },
    {
      title: "9. Liability",
      blocks: [
        {
          type: "p",
          text: "Nothing in these terms excludes or limits liability for damage that cannot be excluded under mandatory law, including damage caused by intent or wilful recklessness.",
        },
        {
          type: "p",
          text: "Subject to that, our liability is limited to damage that is a foreseeable result of a attributable failure in our performance.",
        },
        {
          type: "p",
          text: "We are not liable for indirect or consequential damage, or for acts or omissions of partner venues, except where caused by our own failure or failure to exercise reasonable care in organising the event.",
        },
      ],
    },
    {
      title: "10. Privacy",
      blocks: [
        {
          type: "p",
          text: "We process personal data in accordance with our privacy policy at {{websiteUrl}}/en/privacy.",
        },
      ],
    },
    {
      title: "11. Governing law",
      blocks: [
        {
          type: "p",
          text: "These terms are governed by Dutch law, unless mandatory consumer law in your country of residence requires otherwise.",
        },
        {
          type: "p",
          text: "Disputes will be submitted to the competent court under applicable consumer law.",
        },
      ],
    },
  ],
};

export const privacyEn: LegalDocumentContent = {
  metaTitle: "Privacy policy",
  title: "Privacy policy",
  updatedLabel: "Last updated",
  sections: [
    {
      title: "Who we are",
      blocks: [
        {
          type: "p",
          text: "{{legalName}}\n{{addressBlock}}\nEmail: {{email}}\nChamber of Commerce (KvK): {{kvk}}\nVAT number: {{btw}}",
        },
        {
          type: "p",
          text: "We offer {{tradeName}} at {{websiteUrl}}. This privacy policy explains what personal data we collect, why we use it, who we share it with and what rights you have.",
        },
      ],
    },
    {
      title: "Data controller",
      blocks: [
        {
          type: "p",
          text: "For customers and visitors of {{website}}, {{legalName}} is the data controller for the personal data described in this policy.",
        },
      ],
    },
    {
      title: "What data we collect",
      subsections: [
        {
          title: "Data you provide",
          blocks: [
            {
              type: "ul",
              items: [
                "Making a reservation: your name, email address, number of seats and optional dietary notes;",
                "Contact by email: your name, email address and message content;",
                "Waitlist or newsletter (if available): your email address and preferred city, if you sign up.",
                "At events: photos and videos on which guests may appear recognisably, where you give consent when booking.",
              ],
            },
          ],
        },
        {
          title: "Data we collect automatically",
          blocks: [
            {
              type: "ul",
              items: [
                "Technical data: IP address, browser type, operating system and device information;",
                "Usage data: pages visited and visit times, where needed for security and stability;",
                "Cookies: see the Cookies section below.",
              ],
            },
          ],
        },
        {
          title: "Data we receive from others",
          blocks: [
            {
              type: "p",
              text: "From Stripe, our payment provider, we receive payment status, transaction references, amount paid and currency. We do not store card or bank details ourselves.",
            },
          ],
        },
      ],
      blocks: [],
    },
    {
      title: "Do you have to provide this data?",
      blocks: [
        {
          type: "p",
          text: "Name and email are required to make a reservation. Without them we cannot process your booking. Waitlist or marketing data is always optional.",
        },
      ],
    },
    {
      title: "Why we use your data",
      subsections: [
        {
          title: "To fulfil your reservation",
          blocks: [
            {
              type: "p",
              text: "We use your name, email and booking details to process your reservation, send confirmation and share practical details.",
            },
            {
              type: "p",
              text: "Legal basis: performance of a contract.",
            },
          ],
        },
        {
          title: "To prepare partner venues",
          blocks: [
            {
              type: "p",
              text: "We share limited guest information with your table's partner venue, such as the name on the booking, group size and dietary requirements. We do not share your email, phone or payment details with venues for this purpose.",
            },
            {
              type: "p",
              text: "Dietary information may reveal health data. Providing it is optional; if you choose to do so, we treat that as your explicit consent to share it with the venue.",
            },
            {
              type: "p",
              text: "Legal basis: performance of a contract.",
            },
          ],
        },
        {
          title: "Financial administration",
          blocks: [
            {
              type: "p",
              text: "We retain order and invoice data to comply with legal obligations, including tax retention requirements.",
            },
            {
              type: "p",
              text: "Legal basis: legal obligation.",
            },
          ],
        },
        {
          title: "Website security and stability",
          blocks: [
            {
              type: "p",
              text: "We process technical logs to prevent abuse, keep the website stable and resolve issues.",
            },
            {
              type: "p",
              text: "Legal basis: legitimate interest.",
            },
          ],
        },
        {
          title: "Showing maps",
          blocks: [
            {
              type: "p",
              text: "On some pages we show interactive maps via Apple MapKit so you can view locations.",
            },
            {
              type: "p",
              text: "Legal basis: legitimate interest.",
            },
          ],
        },
        {
          title: "Marketing photos and video",
          blocks: [
            {
              type: "p",
              text: "We sometimes take photos and videos during {{tradeName}} evenings for promotion. Guests may appear recognisably in that material.",
            },
            {
              type: "p",
              text: "Legal basis: consent, given when you complete a reservation and accept our terms and conditions.",
            },
            {
              type: "p",
              text: "Retention: for as long as the material remains commercially relevant for our marketing, usually up to 3 years, unless the law requires otherwise.",
            },
            {
              type: "p",
              text: "You may object, withdraw consent or request deletion via {{email}}. Withdrawal does not have retroactive effect for material already published where reasonable removal is no longer feasible.",
            },
          ],
        },
      ],
      blocks: [],
    },
    {
      title: "Who we share your data with",
      blocks: [
        {
          type: "p",
          text: "We never sell your data. We only share it with parties that help us deliver our services:",
        },
        {
          type: "ul",
          items: [
            "Partner venues — limited guest information to run your table;",
            "Stripe (payments) — processes your payment; we do not store card or bank details;",
            "Supabase (database and storage) — stores booking data and media;",
            "Vercel (hosting) — hosts our website;",
            "Resend (email) — sends booking confirmations on our behalf;",
            "Apple MapKit (maps) — shows maps on event pages where enabled.",
          ],
        },
        {
          type: "p",
          text: "Some processors may process personal data outside the European Economic Area. Where that applies, we rely on an appropriate transfer mechanism such as the EU-US Data Privacy Framework or the European Commission's standard contractual clauses.",
        },
      ],
    },
    {
      title: "Cookies",
      blocks: [
        {
          type: "p",
          text: "Our website currently does not use marketing or analytics cookies. We only use cookies that are strictly necessary for the website and our services to function.",
        },
        {
          type: "p",
          text: "Payments are processed through Stripe's secure checkout. Stripe may place its own cookies on stripe.com during payment.",
        },
        {
          type: "p",
          text: "If we introduce analytics or marketing cookies in the future, we will ask for your consent via a cookie banner and update this policy.",
        },
      ],
    },
    {
      title: "How long we keep your data",
      blocks: [
        {
          type: "ul",
          items: [
            "Order and invoice data: at least 7 years to comply with tax retention rules.",
            "Booking data: as long as needed to fulfil your reservation and any follow-up.",
            "Marketing photos and videos: usually up to 3 years, or shorter if you withdraw consent and removal is reasonably possible.",
            "Technical logs: kept briefly, only as long as needed for security and troubleshooting.",
          ],
        },
      ],
    },
    {
      title: "Your rights",
      blocks: [
        {
          type: "p",
          text: "Under the GDPR you have rights of access, rectification, erasure, restriction, portability and objection. Send requests to {{email}}. We respond within one month.",
        },
        {
          type: "p",
          text: "You may also lodge a complaint with the Dutch Data Protection Authority (Autoriteit Persoonsgegevens): autoriteitpersoonsgegevens.nl.",
        },
      ],
    },
    {
      title: "Children",
      blocks: [
        {
          type: "p",
          text: "Our services are not aimed at children under 18. We do not knowingly collect personal data from children.",
        },
      ],
    },
    {
      title: "Security",
      blocks: [
        {
          type: "p",
          text: "We take appropriate technical and organisational measures to protect your data against unauthorised access, loss or misuse.",
        },
      ],
    },
    {
      title: "Changes",
      blocks: [
        {
          type: "p",
          text: "We may update this privacy policy from time to time. The date at the top shows when it was last revised. For material changes we will inform you via our website.",
        },
      ],
    },
  ],
};
