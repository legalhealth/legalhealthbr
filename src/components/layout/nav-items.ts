import { Home, Sparkles, Gauge, ClipboardList, BookOpen, User } from "lucide-react";

export const navItems = [
  { to: "/", label: "Início", icon: Home, exact: true },
  { to: "/ia", label: "IA", icon: Sparkles },
  { to: "/juriscore", label: "Juriscore®", icon: Gauge },
  { to: "/plano", label: "Plano", icon: ClipboardList },
  { to: "/biblioteca", label: "Biblioteca", icon: BookOpen },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;
