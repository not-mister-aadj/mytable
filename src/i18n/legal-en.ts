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
          text: "Cancelling is not possible. You can, however, exchange your booking for another available date at no cost. For seats included in a membership, article 13 applies.",
        },
        {
          type: "p",
          text: "For Sunday Table you can do this up to 7 days (168 hours) before the start. After that we reserve the wine bar based on the final number of guests and your seat is fixed.",
        },
        {
          type: "p",
          text: "For other tables and events you can do this up to {{exchangeDeadlineHours}} hours before the start.",
        },
        {
          type: "p",
          text: "To exchange, email {{email}}, or use your account once that is possible. Please include your booking code.",
        },
        {
          type: "p",
          text: "After the deadline, exchanging is no longer possible and no refund is due, including if you do not attend.",
        },
        {
          type: "p",
          text: "For bookings made before this version of the terms took effect (see the date at the top), the {{exchangeDeadlineHours}}-hour deadline continues to apply to Sunday Table.",
        },
        {
          type: "p",
          text: "Mandatory statutory consumer rights remain unaffected.",
        },
      ],
    },
    {
      title: "7. Sunday Table: minimum number of guests, venue and table",
      blocks: [
        {
          type: "p",
          text: "A Sunday Table goes ahead from 4 paying guests. At the latest 7 days before the start, we let you know by email whether your table is going ahead.",
        },
        {
          type: "p",
          text: "If the table does not go ahead, we cancel your booking and automatically refund the full amount you paid for your seat, within 14 days and to the payment method you used. We also offer you another date or a table in a nearby city.",
        },
        {
          type: "p",
          text: "We choose the wine bar once the number of guests is known. The table takes place in a wine bar in the city shown with the date. You receive the address by email at the latest 7 days before the start.",
        },
        {
          type: "p",
          text: "The price per seat covers your seat at the table and the organisation. Food and drinks are not included: you order and pay for them yourself at the wine bar.",
        },
        {
          type: "p",
          text: "We group tables by age group (such as 20-39 and 35+) and aim for a convivial, mixed table of about 4 to 6 people. We cannot guarantee exact ages, gender ratio or group size.",
        },
      ],
    },
    {
      title: "8. Not your kind of table? The next one is on us",
      blocks: [
        {
          type: "p",
          text: "If you did not enjoy your Sunday Table, let us know within 2 days after the table via {{email}}, with your booking code. You then receive a free seat at a future Sunday Table.",
        },
        {
          type: "p",
          text: "The following applies:",
        },
        {
          type: "ul",
          items: [
            "you attended the table (this does not apply if you did not show up);",
            "you can use this once per person;",
            "the free seat is valid for 6 months, for a Sunday Table of your choice, subject to availability;",
            "the free seat is personal and cannot be exchanged for money or transferred.",
          ],
        },
        {
          type: "p",
          text: "We may refuse this in case of abuse.",
        },
      ],
    },
    {
      title: "9. Not showing up",
      blocks: [
        {
          type: "p",
          text: "If you do not attend without exchanging in time, your seat lapses without a refund. If this happens repeatedly, we may refuse future bookings. For members, article 13.6 applies.",
        },
      ],
    },
    {
      title: "10. At the table",
      blocks: [
        {
          type: "p",
          text: "Our tables are about a convivial afternoon or evening. We therefore ask everyone:",
        },
        {
          type: "ul",
          items: [
            "to be respectful towards other guests and the venue staff;",
            "not to offer products, services or investments at the table;",
            "not to press others for personal or contact details;",
            "to come only with the people the booking is for;",
            "to drink in moderation; the venue may refuse to serve alcohol.",
          ],
        },
        {
          type: "p",
          text: "Anyone who does not respect this may be asked by us or by the venue to leave, without a refund, and may be excluded from future tables.",
        },
      ],
    },
    {
      title: "11. Changes or cancellation by us",
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
        {
          type: "p",
          text: "For Sunday Table, article 7 also applies: if a table does not go ahead because there are too few guests, we always refund the full amount.",
        },
      ],
    },
    {
      title: "12. Your account",
      blocks: [
        {
          type: "p",
          text: "To book, you can create an account with your email address (you log in with a one-time code we send by email) or with your Google account.",
        },
        {
          type: "p",
          text: "You must be 18 or older and you may have one account per person. Make sure your email address is correct: we send your bookings, the confirmation of your table and the address there.",
        },
        {
          type: "p",
          text: "You can have your account deleted via {{email}}. Existing bookings remain valid. Data we are legally required to keep, for example for our accounts, is kept in line with our privacy policy.",
        },
      ],
    },
    {
      title: "13. Membership",
      blocks: [
        {
          type: "p",
          text: "Besides single seats, we offer a membership for Sunday Table. This article applies to members. The rest of these terms also applies to members, unless this article says otherwise.",
        },
        {
          type: "p",
          text: "13.1 Memberships and prices. You choose from:",
        },
        {
          type: "ul",
          items: [
            "1 month: €12.99 per month;",
            "4 months: €36 for the first 4 months, then €9 per month;",
            "1 year: €99 for the first year, then €8.25 per month.",
          ],
        },
        {
          type: "p",
          text: "Prices include VAT. You pay in advance per period, using the payment methods shown at checkout. We collect the following payments automatically through our payment provider Stripe.",
        },
        {
          type: "p",
          text: "13.2 Term and renewal. Your membership starts as soon as we have received your first payment. After your first period (1 month, 4 months or 1 year) the membership continues automatically for an indefinite period, monthly, at the monthly amount of your membership. From then on you can cancel monthly. At the latest 7 days before a first period of 4 months or 1 year ends, we send you a reminder by email.",
        },
        {
          type: "p",
          text: "13.3 Cancelling. You cancel in your settings on our website (Payment details and cancelling), or via {{email}}. Your cancellation takes effect at the end of the period you have already paid for, with a notice period of at most one month. During your first period, that is the end of that first period. After that we do not charge you again. You receive a confirmation by email. You do not get a refund for the period you have already paid for, except under 13.10.",
        },
        {
          type: "p",
          text: "13.4 What is included. As a member:",
        },
        {
          type: "ul",
          items: [
            "you book a seat at every Sunday Table in the cities where we hold tables at no extra cost, while seats are available and as long as you are a member on the day of the table;",
            "you book a new table 48 hours before non-members;",
            "you can bring one guest per table. Your guest then pays the monthly amount of your membership as the price of the seat (the member price).",
          ],
        },
        {
          type: "p",
          text: "Food and drinks are not included: you order and pay for them at the table yourself. Seats at a table are limited. A membership does not guarantee a seat at a particular table.",
        },
        {
          type: "p",
          text: "13.5 Cancelling your seat. As a member you can cancel your seat free of charge in your settings up to 48 hours before the start, so someone else can join. If you booked a guest, you cancel both seats. What you paid for your guest's seat is not refunded. After that, cancelling is no longer possible. Article 6 (exchanging) does not apply to seats included in your membership.",
        },
        {
          type: "p",
          text: "13.6 Not showing up. If you do not come without cancelling in time, the first time we send you a warning by email. If it happens again after that, each time you cannot book tables for one month. Your membership and your payments continue during that month. We let you know by email from when you can book again.",
        },
        {
          type: "p",
          text: "13.7 A table does not go ahead. Members count towards the minimum number of guests in article 7. If a table still does not go ahead, you hear at the latest 7 days before and you choose another Sunday. Your seat stays included. If your guest paid, we refund that amount.",
        },
        {
          type: "p",
          text: "13.8 Payment fails. If a payment fails, we try again through Stripe and ask you to update your payment details. While a payment is outstanding, you cannot book new tables. If the payment is still not made, we may end your membership.",
        },
        {
          type: "p",
          text: "13.9 Price changes. We may change the prices of the membership. We tell you about a change by email at least 30 days in advance. A period you have already paid for does not change in price. If you do not agree with a price increase, you can cancel before it takes effect.",
        },
        {
          type: "p",
          text: "13.10 Right of withdrawal. You take out a membership online. You then have 14 days to change your mind, counted from the day you become a member. You do not have to give a reason. Because your membership starts straight away and you can book tables immediately, you expressly ask us at checkout to start right away. If you withdraw within those 14 days, we refund what you paid, minus an amount in proportion to the period you were a member until the moment you withdraw. You withdraw via {{email}}. We refund within 14 days, using the payment method you used.",
        },
        {
          type: "p",
          text: "13.11 Deleting your account. If you have your account deleted while you are a member, your membership stops straight away and we do not charge you after that. You do not get a refund for the current period, except under 13.10.",
        },
      ],
    },
    {
      title: "14. Complaints and support",
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
      title: "15. Liability",
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
        {
          type: "p",
          text: "Food, drinks and service are provided by the venue itself. We choose venues with care, but we are not responsible for what the venue serves or charges.",
        },
      ],
    },
    {
      title: "16. Privacy",
      blocks: [
        {
          type: "p",
          text: "We process personal data in accordance with our privacy policy at {{websiteUrl}}/en/privacy.",
        },
      ],
    },
    {
      title: "17. Governing law",
      blocks: [
        {
          type: "p",
          text: "These terms are governed by Dutch law, unless mandatory consumer law in your country of residence requires otherwise.",
        },
        {
          type: "p",
          text: "Disputes will be submitted to the competent court under applicable consumer law.",
        },
        {
          type: "p",
          text: "Right of withdrawal: a booking for a table or event on a fixed date is a leisure service. By law, the 14-day withdrawal period does not apply to it. You can exchange your booking under article 6. A membership does have a 14-day withdrawal period, see article 13.10.",
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
                "Account: your email address, and if you log in with Google also the name linked to your Google account;",
                "Quiz: your answers, such as your date of birth, gender, table preference, cities and preferences;",
                "Membership: the membership you chose, when it started and ends, whether you cancelled, your bookings as a member and whether you missed a table without cancelling;",
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
            {
              type: "p",
              text: "If you are a member, we also receive the status of your subscription, its periods and payments from Stripe. Stripe keeps your payment method (for example your card or a direct debit mandate) to collect the following payments. We do not store those details ourselves.",
            },
            {
              type: "p",
              text: "If you log in with Google, we receive your name, email address and (if available) profile picture from Google. We get no access to your Google password or any other data in your Google account.",
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
          title: "To run your membership",
          blocks: [
            {
              type: "p",
              text: "We use your email address, your membership and your payment status to run your membership: the payments, the reminder before your first period ends, the confirmation when you cancel, your bookings as a member and the rule about not showing up.",
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
            "Partner venues: limited guest information to run your table;",
            "Stripe (payments and subscriptions): processes your payments and, if you are a member, your recurring payments and payment method; we do not store card or bank details;",
            "Supabase (database, storage and login): stores booking data, accounts and media;",
            "Vercel (hosting): hosts our website;",
            "Resend (email): sends booking confirmations and login codes on our behalf;",
            "Google (login): only if you choose to log in with your Google account;",
            "PostHog (product analytics, EU): pageviews, conversion events, heatmaps and session recordings to improve the website; form inputs are masked;",
            "Apple MapKit (maps): shows maps on event pages where enabled.",
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
          text: "We use strictly necessary cookies for the website to function (for example session and language preference).",
        },
        {
          type: "p",
          text: "For product analytics we use PostHog (EU cloud). This may place a cookie or similar storage (localStorage) to measure usage: which pages you view, how far you scroll, where you click, and, with session recording, how you navigate the site. Form fields (such as email and password) are masked in recordings. We do not use this data for advertising profiling.",
        },
        {
          type: "p",
          text: "Payments are processed through Stripe's secure checkout. Stripe may place its own cookies on stripe.com during payment.",
        },
        {
          type: "p",
          text: "If we add marketing cookies or advertising tracking, we will ask for separate consent via a cookie banner.",
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
            "Membership data: as long as you are a member, and after that as long as needed for our administration (payment and invoice data at least 7 years).",
            "Account data: as long as your account exists. If you have your account deleted, we delete that data within 30 days, except what we are legally required to keep.",
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
