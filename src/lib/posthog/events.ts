/** PostHog event names: snake_case, keep in sync across client + server. */
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
  /** @deprecated use paymentCompleted, kept for admin HogQL during migration */
  bookingPaid: "booking_paid",
  /** @deprecated use eventDetailViewed */
  eventPageViewed: "event_page_viewed",
  /** @deprecated use emailSignupCompleted */
  waitlistSignup: "waitlist_signup",
  whatsappJoinClicked: "whatsapp_join_clicked",
  sundayTableCtaClicked: "sunday_table_cta_clicked",
  sundayTableEnglishRequested: "sunday_table_english_requested",
  scrollDepthReached: "scroll_depth_reached",
  onboardingStepViewed: "onboarding_step_viewed",
  onboardingStepCompleted: "onboarding_step_completed",
  premiumExperienceViewed: "premium_experience_viewed",
  groupInvitationStarted: "group_invitation_started",
  groupInvitationShared: "group_invitation_shared",
  sundayShowUp: "sunday_show_up",
  inviteShareClicked: "invite_share_clicked",
  culinaryBookedWithin30dOfSunday: "culinary_booked_within_30d_of_sunday",
  customerCreated: "customer_created",
  customerUpdated: "customer_updated",
  customerProfileViewed: "customer_profile_viewed",
  customerNoteAdded: "customer_note_added",
  sundayTableWaitlistEnriched: "sunday_table_waitlist_enriched",
  /** "Jouw tafel" landing page (/jouw-tafel), variant B of the homepage test. */
  landingSectionViewed: "landing_section_viewed",
  landingCtaClicked: "landing_cta_clicked",
  landingSignupPageViewed: "landing_signup_page_viewed",
  landingLoginPageViewed: "landing_login_page_viewed",
  /** Account screens behind the landing page (sign up / log in). */
  authScreenViewed: "auth_screen_viewed",
  authCodeRequested: "auth_code_requested",
  authCodeVerified: "auth_code_verified",
  authCodeFailed: "auth_code_failed",
  authGoogleClicked: "auth_google_clicked",
  authGoogleHiddenInApp: "auth_google_hidden_in_app",
  authLoggedOut: "auth_logged_out",
  /** Quiz after signing up (/jouw-tafel/start). No personal data, ever. */
  quizStepViewed: "quiz_step_viewed",
  quizStepCompleted: "quiz_step_completed",
  quizStepLeft: "quiz_step_left",
  quizBackClicked: "quiz_back_clicked",
  quizResumed: "quiz_resumed",
  quizCompleted: "quiz_completed",
  quizChooseViewed: "quiz_choose_viewed",
  quizReserveClicked: "quiz_reserve_clicked",
  quizNotifyClicked: "quiz_notify_clicked",
  quizShareClicked: "quiz_share_clicked",
  quizInfoOpened: "quiz_info_opened",
  /** Settings page for members (/jouw-tafel/instellingen). No personal data. */
  settingsOpened: "settings_opened",
  settingChanged: "setting_changed",
  notificationsToggled: "notifications_toggled",
  bookingOpened: "booking_opened",
  accountDeleted: "account_deleted",
  quizLogoutClicked: "quiz_logout_clicked",
  /** A customer moved their own seat to the next Sunday (days_before only). */
  bookingRescheduled: "booking_rescheduled",
  /** Kies -> table page -> reserve step. No personal data. */
  tableOpened: "table_opened",
  tablePageViewed: "table_page_viewed",
  tableReserveClicked: "table_reserve_clicked",
  reserveStepViewed: "reserve_step_viewed",
  reserveOptionSelected: "reserve_option_selected",
  reserveCheckoutClicked: "reserve_checkout_clicked",
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
  | "sunday_table"
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
  | "waitlist"
  | "sunday_table_lp_waitlist";
