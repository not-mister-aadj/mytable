export {
  DEFAULT_EMAIL_FROM,
  getEmailFrom,
  getResendClient,
  isEmailConfigured,
  type EmailSendResult,
} from "@/lib/email/resend";
export {
  sendBookingConfirmationEmail,
  sendBookingConfirmationForPaidBooking,
  sendBookingConfirmationByBookingId,
} from "@/lib/email/sendBookingConfirmationEmail";
export { sendBookingMovedEmail } from "@/lib/email/sendBookingMovedEmail";
export {
  buildBookingConfirmationEmailProps,
  buildBookingMovedEmailProps,
} from "@/lib/email/build-email-props";
