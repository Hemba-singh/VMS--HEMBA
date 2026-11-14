import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { VoterCategory, VoterColorState } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface VoterCategoryStyleSet {
  category: VoterCategory;
  colorStateLabel: VoterColorState;
  badge: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
  ring: string;
  rowBorder: string;
  rowBg: string;
}

const CATEGORY_STYLE_MAP: Record<VoterCategory, VoterCategoryStyleSet> = {
  [VoterCategory.Voter]: {
    category: VoterCategory.Voter,
    colorStateLabel: 'Our Voter',
    badge: 'bg-emerald-500 border-emerald-600 text-white',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-300',
    dot: 'bg-emerald-500',
    ring: 'ring-emerald-500',
    rowBorder: '',
    rowBg: 'bg-emerald-50/25',
  },
  [VoterCategory.Opponent]: {
    category: VoterCategory.Opponent,
    colorStateLabel: 'Opponent Voter',
    badge: 'bg-red-500 border-red-600 text-white',
    bg: 'bg-red-50',
    text: 'text-red-800',
    border: 'border-red-300',
    dot: 'bg-red-500',
    ring: 'ring-red-500',
    rowBorder: '',
    rowBg: 'bg-red-50/25',
  },
  [VoterCategory.Pending]: {
    category: VoterCategory.Pending,
    colorStateLabel: 'Pending Voter',
    badge: 'bg-amber-400 border-amber-500 text-white',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-300',
    dot: 'bg-amber-400',
    ring: 'ring-amber-400',
    rowBorder: '',
    rowBg: 'bg-amber-50/20',
  },
  [VoterCategory.Worker]: {
    category: VoterCategory.Worker,
    colorStateLabel: 'Worker Voter',
    badge: 'bg-blue-600 border-blue-600 text-white',
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-300',
    dot: 'bg-blue-600',
    ring: 'ring-blue-600',
    rowBorder: '',
    rowBg: 'bg-blue-50/25',
  },
};

export const VOTER_CATEGORIES: VoterCategory[] = [
  VoterCategory.Voter,
  VoterCategory.Opponent,
  VoterCategory.Pending,
  VoterCategory.Worker,
];

export function normalizeVoterCategory(
  input?: VoterCategory | VoterColorState | string | null
): VoterCategory {
  switch (input) {
    case VoterCategory.Voter:
    case 'Our Voter':
    case 'Voter':
      return VoterCategory.Voter;
    case VoterCategory.Opponent:
    case 'Opponent Voter':
    case 'Opponent':
      return VoterCategory.Opponent;
    case VoterCategory.Worker:
    case 'Worker Voter':
    case 'Worker':
      return VoterCategory.Worker;
    case VoterCategory.Pending:
    case 'Pending Voter':
    case 'Pending':
    default:
      return VoterCategory.Pending;
  }
}

export function categoryToColorStateLabel(category?: VoterCategory | string): VoterColorState {
  const norm = normalizeVoterCategory(category);
  return CATEGORY_STYLE_MAP[norm].colorStateLabel;
}

/**
 * Maps a VoterCategory enum value to corresponding Tailwind CSS color classes.
 */
export function getVoterCategoryColor(
  category?: VoterCategory | VoterColorState | string | null
): string {
  const norm = normalizeVoterCategory(category);
  switch (norm) {
    case VoterCategory.Voter:
      return 'bg-emerald-500 border-emerald-600';
    case VoterCategory.Opponent:
      return 'bg-red-500 border-red-600';
    case VoterCategory.Worker:
      return 'bg-[#0071e3] border-blue-600';
    case VoterCategory.Pending:
    default:
      return 'bg-amber-400 border-amber-500';
  }
}

/**
 * Returns the full set of Tailwind color classes for a VoterCategory.
 */
export function getVoterCategoryStyles(
  category?: VoterCategory | VoterColorState | string | null
): VoterCategoryStyleSet {
  const norm = normalizeVoterCategory(category);
  return CATEGORY_STYLE_MAP[norm];
}

export const getVoterCategoryColorClasses = getVoterCategoryColor;
export const getCategoryColorClasses = getVoterCategoryColor;
export const getCategoryColor = getVoterCategoryColor;
