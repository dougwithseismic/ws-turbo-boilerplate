import {
  ApplicationShell,
  ApplicationShellMain,
  ApplicationShellNavigation,
} from "@/features/application-shell";

const ApplicationLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <ApplicationShell>
      <ApplicationShellNavigation />
      <ApplicationShellMain>{children}</ApplicationShellMain>
    </ApplicationShell>
  );
};

export default ApplicationLayout;
