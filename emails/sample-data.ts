import type { BookingConfirmationEmailProps } from "@/emails/BookingConfirmationEmail";
import type { BookingMovedEmailProps } from "@/emails/BookingMovedEmail";
import type { SundayTableCancelEmailProps } from "@/emails/SundayTableCancelEmail";
import type { SundayTableConfirmationEmailProps } from "@/emails/SundayTableConfirmationEmail";
import type { SundayTableLocationEmailProps } from "@/emails/SundayTableLocationEmail";

export const sampleBookingConfirmationProps: BookingConfirmationEmailProps = {
  customerName: "Sophie",
  customerEmail: "sophie@voorbeeld.nl",
  eventName: "Wijnspijs proeverij",
  city: "Rotterdam",
  date: "Vrijdag 28 juni",
  time: "19:00–22:00",
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
  oldTime: "19:00–22:00",
  newEventName: "Wijnspijs proeverij",
  newCity: "Amsterdam",
  newDate: "Zaterdag 5 juli",
  newTime: "18:30–21:30",
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
