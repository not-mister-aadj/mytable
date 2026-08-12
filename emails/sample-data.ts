import type { BookingConfirmationEmailProps } from "@/emails/BookingConfirmationEmail";
import type { BookingMovedEmailProps } from "@/emails/BookingMovedEmail";
import type { MembershipRenewalReminderEmailProps } from "@/emails/MembershipRenewalReminderEmail";
import type { SundayTableCancelEmailProps } from "@/emails/SundayTableCancelEmail";
import type { SundayTableConfirmationEmailProps } from "@/emails/SundayTableConfirmationEmail";
import type { SundayTableLocationEmailProps } from "@/emails/SundayTableLocationEmail";
import type { SundayTablePlusOneEmailProps } from "@/emails/SundayTablePlusOneEmail";
import type { SundayTableReviewEmailProps } from "@/emails/SundayTableReviewEmail";
import type { SundayTableWaitlistWelcomeEmailProps } from "@/emails/SundayTableWaitlistWelcomeEmail";
import type { SundayTableWaitlistInviteEmailProps } from "@/emails/SundayTableWaitlistInviteEmail";

export const sampleBookingConfirmationProps: BookingConfirmationEmailProps = {
  customerName: "Sophie",
  customerEmail: "sophie@voorbeeld.nl",
  eventName: "Wijnspijs proeverij",
  city: "Rotterdam",
  date: "Vrijdag 28 juni",
  time: "19:00-22:00",
  seats: 2,
  totalPaid: "€ 98,00",
  bookingCode: "MT-A1B2C3D4",
  eventUrl: "https://mytable.club/agenda/wijnspijs-proeferij-Rotterdam-28-06-26",
  venueName: "Restaurant De Proeverij",
  startLocation: "Grote Markt 12, Rotterdam",
  dietaryNotes: "Vegetarisch, geen noten",
};

export const sampleBookingMovedProps: BookingMovedEmailProps = {
  customerName: "Sophie",
  customerEmail: "sophie@voorbeeld.nl",
  oldEventName: "Wijnspijs proeverij",
  oldCity: "Rotterdam",
  oldDate: "Vrijdag 28 juni",
  oldTime: "19:00-22:00",
  newEventName: "Wijnspijs proeverij",
  newCity: "Amsterdam",
  newDate: "Zaterdag 5 juli",
  newTime: "18:30-21:30",
  seats: 2,
  bookingCode: "MT-A1B2C3D4",
  eventUrl: "https://mytable.club/agenda/wijnspijs-proeferij-Amsterdam-05-07-26",
};

export const sampleSundayTableConfirmationProps: SundayTableConfirmationEmailProps =
  {
    locale: "nl",
    firstName: "Sophie",
    city: "Rotterdam",
    date: "zondag 2 augustus 2026",
    time: "14:00",
    tableType: "girls_only",
    plusOne: false,
    clubmemberUrl: "https://mytable.club/clubmember",
    calendarUrl:
      "https://mytable.club/api/clubmember/calendar?city=Rotterdam&date=2026-08-02&type=girls_only&locale=nl",
  };

export const sampleSundayTableCancelProps: SundayTableCancelEmailProps = {
  locale: "nl",
  firstName: "Sophie",
  city: "Rotterdam",
  date: "zondag 2 augustus 2026",
  time: "14:00",
  tableType: "girls_only",
  clubmemberUrl: "https://mytable.club/clubmember",
};

export const sampleSundayTablePlusOneAddedProps: SundayTablePlusOneEmailProps = {
  locale: "nl",
  firstName: "Sophie",
  city: "Rotterdam",
  date: "zondag 6 september 2026",
  time: "14:00",
  tableType: "mixed",
  action: "added",
  clubmemberUrl: "https://mytable.club/clubmember",
};

export const sampleSundayTablePlusOneRemovedProps: SundayTablePlusOneEmailProps =
  {
    ...sampleSundayTablePlusOneAddedProps,
    action: "removed",
  };

export const sampleSundayTableLocationProps: SundayTableLocationEmailProps = {
  locale: "nl",
  firstName: "Sophie",
  city: "Rotterdam",
  date: "zondag 2 augustus 2026",
  time: "14:00",
  tableType: "girls_only",
  venueName: "Café De Tafel",
  address: "Witte de Withstraat 12, Rotterdam",
  notes: "Bel aan bij de rode deur.",
  calendarUrl:
    "https://mytable.club/api/clubmember/calendar?city=Rotterdam&date=2026-08-02&type=girls_only&locale=nl",
};

export const sampleSundayTableWaitlistWelcomeProps: SundayTableWaitlistWelcomeEmailProps =
  {
    locale: "nl",
    firstName: "Sophie",
    city: "Rotterdam",
  };

export const sampleSundayTableWaitlistInviteProps: SundayTableWaitlistInviteEmailProps =
  {
    locale: "nl",
    firstName: "Sophie",
    city: "Rotterdam",
    dateLabel: "zondag 2 augustus 2026",
    timeLabel: "14:00",
    tableType: "girls_only",
    seatsLeft: 4,
    claimUrl: "https://mytable.club/join?city=Rotterdam",
    priceHint: "Vanaf €8,33/maand (12 mnd)",
  };

export const sampleSundayTableReviewProps: SundayTableReviewEmailProps = {
  locale: "nl",
  firstName: "Sophie",
  city: "Rotterdam",
  reviewUrl: "https://www.mytable.club/review/sample-token",
};

export const sampleMembershipRenewalReminderProps: MembershipRenewalReminderEmailProps =
  {
    locale: "nl",
    firstName: "Sophie",
    variant: "trial_upsell",
    planLabel: "MyTable Club · 1 maand trial",
    amountLabel: "€ 21,00",
    renewalDateLabel: "zondag 6 september 2026",
    manageUrl: "https://www.mytable.club/clubmember",
    nextTableDateLabel: "zondag 6 september 2026",
    nextTableIsSoon: true,
    plan1mTotalLabel: "€ 21,00",
    plan5mTotalLabel: "€ 50,00",
    plan12mTotalLabel: "€ 100,00",
    plan5mPerMonthLabel: "€ 10,00",
    plan12mPerMonthLabel: "€ 8,33",
  };
