import { Home, Sparkles, Gauge, ClipboardList, BookOpen, User } from "lucide-react";
import type { LinkProps } from "@tanstack/react-router";
import type { ComponentType } from "react";

type NavItem = {
  to: LinkProps["to"];
  label: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  exact: boolean;
};

export const navItems: NavItem[] = [
  { to: "/", label: "Início", icon: Home, exact: true },
  { to: "/ia", label: "IA", icon: Sparkles, exact: false },
  { to: "/juriscore", label: "Juriscore®", icon: Gauge, exact: false },
  { to: "/plano", label: "Plano", icon: ClipboardList, exact: false },
  { to: "/biblioteca", label: "Biblioteca", icon: BookOpen, exact: false },
  { to: "/perfil", label: "Perfil", icon: User, exact: false },
];
