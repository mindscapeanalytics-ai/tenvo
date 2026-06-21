import { cn } from '@/lib/utils';
import {
  MARKETING_CONTAINER,
  MARKETING_CONTAINER_NARROW,
  MARKETING_SECTION,
  MARKETING_SECTION_LOOSE,
  MARKETING_SECTION_TIGHT,
} from '@/lib/utils/marketingLayout';

const PADDING = {
  default: MARKETING_SECTION,
  tight: MARKETING_SECTION_TIGHT,
  loose: MARKETING_SECTION_LOOSE,
  none: '',
};

const WIDTH = {
  default: MARKETING_CONTAINER,
  narrow: MARKETING_CONTAINER_NARROW,
  full: 'w-full min-w-0 px-4 min-[380px]:px-5 sm:px-6 lg:px-12',
};

/**
 * Consistent section wrapper for marketing pages.
 */
export function MarketingSection({
  children,
  className,
  innerClassName,
  as: Tag = 'section',
  padding = 'default',
  width = 'default',
  id,
  ...rest
}) {
  return (
    <Tag id={id} className={cn(PADDING[padding], className)} {...rest}>
      <div className={cn(WIDTH[width], innerClassName)}>{children}</div>
    </Tag>
  );
}

/**
 * Simple top-of-page header for help, legal, and utility marketing routes.
 */
export function MarketingPageHeader({
  title,
  description,
  children,
  className,
}) {
  return (
    <MarketingSection
      padding="default"
      width="narrow"
      className={cn('border-b border-neutral-200/80 bg-white', className)}
    >
      <h1 className="text-balance text-2xl font-black tracking-tight text-neutral-900 sm:text-3xl lg:text-4xl">
        {title}
      </h1>
      {description ? (
        <div className="mt-3 text-sm font-medium leading-relaxed text-neutral-600 sm:text-base">
          {description}
        </div>
      ) : null}
      {children}
    </MarketingSection>
  );
}

export default MarketingSection;
