/** PostHog event names — snake_case, keep in sync across client + server. */
export const PostHogEvents = {
  pageViewed: "page_viewed",
  agendaViewed: "agenda_viewed",
  eventCardClicked: "event_card_clicked",
  eventDetailViewed: "event_detail_viewed",
  bookingStarted: "booking_started",
  seatsSelected: "seats_selected",
  checkoutStarted: "checkout_started",
  paymentCompleted: "payment_completed",
  paymentFailed: "payment_failed",
  bookingConfirmationViewed: "booking_confirmation_viewed",
  languageChanged: "language_changed",
  cityFilterChanged: "city_filter_changed",
  eventTypeFilterChanged: "event_type_filter_changed",
  emailSignupCompleted: "email_signup_completed",
  /** @deprecated use paymentCompleted — kept for admin HogQL during migration */
  bookingPaid: "booking_paid",
  /** @deprecated use eventDetailViewed */
  eventPageViewed: "event_page_viewed",
  /** @deprecated use emailSignupCompleted */
  waitlistSignup: "waitlist_signup",
  whatsappJoinClicked: "whatsapp_join_clicked",
  sundayTableCtaClicked: "sunday_table_cta_clicked",
  premiumExperienceViewed: "premium_experience_viewed",
  groupInvitationStarted: "group_invitation_started",
  groupInvitationShared: "group_invitation_shared",
  clubmemberPaid: "clubmember_paid",
  sundayRsvp: "sunday_rsvp",
  sundayShowUp: "sunday_show_up",
  inviteShareClicked: "invite_share_clicked",
  culinaryBookedWithin30dOfSunday: "culinary_booked_within_30d_of_sunday",
  customerCreated: "customer_created",
  customerUpdated: "customer_updated",
  customerProfileViewed: "customer_profile_viewed",
  customerNoteAdded: "customer_note_added",
} as const;

export type PostHogEventName =
  (typeof PostHogEvents)[keyof typeof PostHogEvents];

export type PageType =
  | "home"
  | "agenda"
  | "event_detail"
  | "checkout"
  | "success"
  | "failed"
  | "legal"
  | "join"
  | "clubmember"
  | "girls_only"
  | "blog"
  | "account"
  | "auth"
  | "waitlist"
  | "other";

export type AnalyticsSourceSection =
  | "home_grid"
  | "agenda_grid"
  | "related"
  | "hero_next_event"
  | "detail_page"
  | "agenda_card"
  | "home"
  | "agenda"
  | "event_detail"
  | "sold_out_cta"
  | "girls_only_presale"
  | "girls_only_city_priority"
  | "member_club_sunday_table"
  | "waitlist";
