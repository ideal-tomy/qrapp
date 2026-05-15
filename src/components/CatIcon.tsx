import {
  Briefcase,
  UtensilsCrossed,
  Gamepad2,
  ShoppingBag,
  Plane,
  BookOpen,
  User,
  FolderOpen,
} from 'lucide-react';
import type { IconName } from '../types';

const ICON_MAP: Record<IconName, typeof Briefcase> = {
  briefcase: Briefcase,
  food: UtensilsCrossed,
  gamepad: Gamepad2,
  shopping: ShoppingBag,
  plane: Plane,
  book: BookOpen,
  user: User,
  folder: FolderOpen,
};

interface CatIconProps {
  name: string;
  size?: number;
  color?: string;
}

export function CatIcon({ name, size = 18, color }: CatIconProps) {
  const Comp = ICON_MAP[name as IconName] ?? User;
  return <Comp size={size} color={color} strokeWidth={2} />;
}
