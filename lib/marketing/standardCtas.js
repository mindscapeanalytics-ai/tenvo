/**
 * Standard marketing CTA definitions for consistency across all pages.
 * Use these constants instead of hardcoding CTA text to maintain brand voice.
 */

import { getBookMeetingHref } from './salesLinks';

export const STANDARD_CTAS = {
  primary: {
    text: 'Start free',
    textMobile: 'Start free',
    href: '/register',
    variant: 'default',
    trackingLabel: 'primary_cta_register',
  },
  secondary: {
    sales: {
      text: 'Book a meeting',
      textMobile: 'Book meeting',
      href: getBookMeetingHref(),
      variant: 'outline',
      trackingLabel: 'secondary_cta_sales',
    },
    pricing: {
      text: 'View pricing',
      textMobile: 'Pricing',
      href: '/pricing',
      variant: 'outline',
      trackingLabel: 'secondary_cta_pricing',
    },
    demo: {
      text: 'Explore demos',
      textMobile: 'Demos',
      href: '/demo',
      variant: 'outline',
      trackingLabel: 'secondary_cta_demo',
    },
    features: {
      text: 'See features',
      textMobile: 'Features',
      href: '/features',
      variant: 'outline',
      trackingLabel: 'secondary_cta_features',
    },
    whyTenvo: {
      text: 'Why TENVO',
      textMobile: 'Why TENVO',
      href: '/why-tenvo',
      variant: 'outline',
      trackingLabel: 'secondary_cta_why',
    },
  },
  workspace: {
    authenticated: {
      text: 'Open workspace',
      textMobile: 'Workspace',
      href: '/multi-business',
      variant: 'default',
      trackingLabel: 'workspace_cta_auth',
    },
    unauthenticated: {
      text: 'Start free',
      textMobile: 'Start free',
      href: '/register',
      variant: 'default',
      trackingLabel: 'workspace_cta_unauth',
    },
  },
};

/**
 * Get workspace CTA based on authentication status
 * @param {boolean} isAuthenticated
 */
export function getWorkspaceCta(isAuthenticated) {
  return isAuthenticated
    ? STANDARD_CTAS.workspace.authenticated
    : STANDARD_CTAS.workspace.unauthenticated;
}

/**
 * Get CTA text based on screen size
 * @param {object} cta - CTA object from STANDARD_CTAS
 * @param {boolean} isMobile
 */
export function getCtaText(cta, isMobile = false) {
  return isMobile && cta.textMobile ? cta.textMobile : cta.text;
}
