"use client";

import { usePathname } from "next/navigation";

import { useApplicationShellStore } from "../index";
import {
  identityNav,
  leadsNav,
  mainNav,
  NavSection,
  projectsNav,
} from "./navigation/index";
import { DesktopHeader } from "./shell-nav/desktop-header";
import { MobileHeader } from "./shell-nav/mobile-header";

interface ShellNavProps {
  isForcedExpanded?: boolean;
}

export function ShellNav({ isForcedExpanded }: ShellNavProps = {}) {
  const pathname = usePathname();
  const { isSidebarExpanded, isSidebarHovered, toggleSidebar } =
    useApplicationShellStore();

  // Use forced expanded state for mobile or regular state for desktop
  const isExpanded = isForcedExpanded || isSidebarExpanded;
  const showHoverEffects = !isForcedExpanded && isSidebarHovered;

  return (
    <div className="flex h-full w-full flex-col bg-background border-r border-border">
      {isForcedExpanded ? (
        <MobileHeader />
      ) : (
        <DesktopHeader
          isExpanded={isExpanded}
          showHoverEffects={showHoverEffects}
          onToggle={toggleSidebar}
        />
      )}

      <div className="flex-1 py-3 flex flex-col items-center overflow-hidden">
        <NavSection
          items={mainNav}
          isCollapsed={!isExpanded}
          pathname={pathname}
        />
        <NavSection
          title="Identity"
          items={identityNav}
          isCollapsed={!isExpanded}
          pathname={pathname}
        />
        <NavSection
          title="Reports"
          items={leadsNav}
          isCollapsed={!isExpanded}
          pathname={pathname}
        />
        <NavSection
          title="Guides & Resources"
          items={projectsNav}
          isCollapsed={!isExpanded}
          pathname={pathname}
        />
      </div>
    </div>
  );
}
