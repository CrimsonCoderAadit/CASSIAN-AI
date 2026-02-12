"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Home",
    href: "/home",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: "Upload",
    href: "/upload",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" x2="12" y1="3" y2="15" />
      </svg>
    ),
  },
  {
    label: "Repositories",
    href: "/repositories",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    label: "Chat",
    href: "/chat",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
];

const sidebarVariants = {
  hidden: { x: -224, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const },
  },
};

const navItemVariants = {
  hidden: { x: -16, opacity: 0 },
  visible: (i: number) => ({
    x: 0,
    opacity: 1,
    transition: { delay: 0.15 + i * 0.06, duration: 0.3, ease: "easeOut" as const },
  }),
};

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <motion.aside
      className="flex h-screen w-56 flex-col border-r border-border bg-surface transition-theme"
      variants={sidebarVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Brand */}
      <div className="flex h-16 items-center gap-1.5 px-5">
        <span className="text-glow-neon text-lg font-bold tracking-[0.15em] text-neon">
          CASSIAN
        </span>
        <span className="mt-0.5 rounded bg-neon/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-neon/70">
          .AI
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 px-3 pt-2">
        {NAV_ITEMS.map((item, i) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/home" && pathname.startsWith(item.href));

          return (
            <motion.div
              key={item.href}
              custom={i}
              variants={navItemVariants}
              initial="hidden"
              animate="visible"
            >
              <Link
                href={item.href}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "glow-neon-sm bg-neon/10 text-neon"
                    : "text-muted hover:bg-surface-hover hover:text-foreground"
                }`}
              >
                <motion.span
                  className={`transition-colors duration-200 ${
                    isActive
                      ? "text-neon"
                      : "text-muted group-hover:text-foreground"
                  }`}
                  whileHover={{ scale: 1.15 }}
                  transition={{ duration: 0.15 }}
                >
                  {item.icon}
                </motion.span>
                {item.label}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Footer with glowing icon easter egg */}
      <div className="border-t border-border px-5 py-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] tracking-wider text-muted/50">
            CASSIAN v0.1.0
          </p>
          {/* Glowing icon — pulses on hover */}
          <motion.div
            className="group relative cursor-default"
            whileHover={{ scale: 1.3 }}
            transition={{ duration: 0.2 }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-neon/20 transition-all duration-300 group-hover:text-neon group-hover:drop-shadow-[0_0_6px_rgba(var(--accent-rgb),0.5)]"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </motion.div>
        </div>
      </div>
    </motion.aside>
  );
}
