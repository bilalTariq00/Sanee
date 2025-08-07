import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import English translations
import enCommon from '@/locales/en/common.json';
import enAuth from '@/locales/en/auth.json';
import enJobs from '@/locales/en/jobs.json';
import enGigs from '@/locales/en/gigs.json';
import enContracts from '@/locales/en/contracts.json';
import enProfile from '@/locales/en/profile.json';
import enDiscover from '@/locales/en/discover.json';
import enWallet from '@/locales/en/wallet.json';
import enLanding from '@/locales/en/landing.json';
import enCategoriesPage from '@/locales/en/categories_page.json';
import enCheckout from '@/locales/en/checkout.json';
import enProposals from '@/locales/en/proposals.json';
import enReviews from '@/locales/en/reviews.json';
import enSupport from '@/locales/en/support.json';

// Import Arabic translations
import arCommon from '@/locales/ar/common.json';
import arAuth from '@/locales/ar/auth.json';
import arJobs from '@/locales/ar/jobs.json';
import arGigs from '@/locales/ar/gigs.json';
import arContracts from '@/locales/ar/contracts.json';
import arProfile from '@/locales/ar/profile.json';
import arDiscover from '@/locales/ar/discover.json';
import arWallet from '@/locales/ar/wallet.json';
import arLanding from '@/locales/ar/landing.json';
import arCategoriesPage from '@/locales/ar/categories_page.json';
import arCheckout from '@/locales/ar/checkout.json';
import arProposals from '@/locales/ar/proposals.json';
import arReviews from '@/locales/ar/reviews.json';
import arSupport from '@/locales/ar/support.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: {
        translation: {
          ...enCommon,
          ...enAuth,
          ...enJobs,
          ...enGigs,
          ...enContracts,
          ...enProfile,
          ...enDiscover,
          ...enWallet,
          ...enLanding,
          ...enCategoriesPage,
          ...enCheckout,
          ...enProposals,
          ...enReviews,
          ...enSupport,
        },
      },
      ar: {
        translation: {
          ...arCommon,
          ...arAuth,
          ...arJobs,
          ...arGigs,
          ...arContracts,
          ...arProfile,
          ...arDiscover,
          ...arWallet,
          ...arLanding,
          ...arCategoriesPage,
          ...arCheckout,
          ...arProposals,
          ...arReviews,
          ...arSupport,
        },
      },
    },
  });

export default i18n;
