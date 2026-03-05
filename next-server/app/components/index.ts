// Component exports - barrel file for easy imports
export { Header } from './Header';
export { MobileNav } from './MobileNav';
export { Hero } from './Hero';
export { Footer } from './Footer';
export { MobileBottomBar } from './MobileBottomBar';

export { SearchBox } from './Search/SearchBox';
export { SuggestionPills } from './Search/SuggestionPills';
export { SearchResults } from './Search/SearchResults';

export { ThemeCard } from './Theme/ThemeCard';
export { ThemeGrid } from './Theme/ThemeGrid';

export { VerseCard } from './Verse/VerseCard';
export { VerseOfDayPanel } from './Verse/VerseOfDayPanel';

export { ScholarsToolkit } from './Toolkit/ScholarsToolkit';

// Types
export type {
  VerseResult,
  VerseOfDay,
  Theme,
  SuggestedQuery,
  NavItem,
  NavLink,
  FilterOption,
} from './types';
