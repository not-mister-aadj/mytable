import { Head } from "@react-email/components";
import { emailBrand, emailSpacing } from "../brand";

export function EmailStyles() {
  return (
    <Head>
      <style>{`
        .email-card-inner {
          padding-top: ${emailSpacing.cardPaddingTop} !important;
          padding-right: ${emailSpacing.cardPaddingRight} !important;
          padding-bottom: ${emailSpacing.cardPaddingBottom} !important;
          padding-left: ${emailSpacing.cardPaddingLeft} !important;
        }
        @media only screen and (max-width: 480px) {
          .email-body { padding: 24px 16px !important; }
          .email-card-inner {
            padding-top: ${emailSpacing.cardPaddingMobileTop} !important;
            padding-right: ${emailSpacing.cardPaddingMobileRight} !important;
            padding-bottom: ${emailSpacing.cardPaddingMobileBottom} !important;
            padding-left: ${emailSpacing.cardPaddingMobileLeft} !important;
          }
          .email-hero-headline { font-size: 28px !important; }
          .email-hero-art { display: none !important; }
          .email-hero-text { width: 100% !important; }
          .email-cta-button {
            display: block !important;
            width: 100% !important;
            box-sizing: border-box !important;
            min-height: 50px !important;
            line-height: 50px !important;
            padding-top: 0 !important;
            padding-bottom: 0 !important;
          }
          .email-grid-4-cell {
            display: inline-block !important;
            width: 50% !important;
            padding-right: 6px !important;
            padding-bottom: 16px !important;
            box-sizing: border-box !important;
            vertical-align: top !important;
          }
        }
        a.email-cta-primary:hover { background-color: ${emailBrand.burgundyDark} !important; }
      `}</style>
    </Head>
  );
}
