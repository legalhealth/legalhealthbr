import { Home, Sparkles, Gauge, ClipboardList, BookOpen, User } from "lucide-react";
import type { ComponentType } from "react";

type NavItem = {
  to: "/inicio" | "/ia" | "/juriscore" | "/plano" | "/biblioteca" | "/perfil";
  label: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  exact: boolean;
};

export const navItems: NavItem[] = [
  { to: "/inicio", label: "Início", icon: Home, exact: true },
  { to: "/ia", label: "IA", icon: Sparkles, exact: false },
  { to: "/juriscore", label: "Juriscore®", icon: Gauge, exact: false },
  { to: "/plano", label: "Plano", icon: ClipboardList, exact: false },
  { to: "/biblioteca", label: "Biblioteca", icon: BookOpen, exact: false },
  { to: "/perfil", label: "Perfil", icon: User, exact: false },
];
