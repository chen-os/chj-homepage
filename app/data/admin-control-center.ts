export type SiteStatusItem = {
  domain: string;
  status: "online" | "offline" | "unknown";
};

export type GitHubStatus = {
  latestCommit: string;
  updatedAt: string;
  message: string;
};

export type VercelEnvironmentStatus = {
  label: string;
  environment: "production" | "preview";
  url: string;
  deployedAt: string;
  status: "ready" | "building" | "error";
};

export type DnsStatusItem = {
  domain: string;
  type: string;
  value: string;
  status: "active" | "pending" | "unknown";
};

export type ProjectLink = {
  id: string;
  label: string;
  href: string | null;
  comingSoon?: boolean;
};

export type ControlCenterData = {
  sites: SiteStatusItem[];
  github: GitHubStatus;
  vercel: VercelEnvironmentStatus[];
  dns: DnsStatusItem[];
  projects: ProjectLink[];
};

/** Mock data — replace with GitHub / Vercel API responses later. */
export const mockControlCenterData: ControlCenterData = {
  sites: [
    { domain: "chj.jp", status: "online" },
    { domain: "pony.chj.jp", status: "online" },
  ],
  github: {
    latestCommit: "a3f9c21",
    updatedAt: "2026-05-30T14:32:00+09:00",
    message: "Add Pony Life Dashboard V1 with Japanese UI",
  },
  vercel: [
    {
      label: "Production",
      environment: "production",
      url: "https://chj.jp",
      deployedAt: "2026-05-30T15:10:00+09:00",
      status: "ready",
    },
    {
      label: "Preview",
      environment: "preview",
      url: "https://my-app-git-main-chj.vercel.app",
      deployedAt: "2026-05-30T12:45:00+09:00",
      status: "ready",
    },
  ],
  dns: [
    {
      domain: "chj.jp",
      type: "A",
      value: "76.76.21.21",
      status: "active",
    },
    {
      domain: "pony.chj.jp",
      type: "CNAME",
      value: "cname.vercel-dns.com",
      status: "active",
    },
  ],
  projects: [
    { id: "chj-home", label: "CHJ Home", href: "https://chj.jp" },
    { id: "pony", label: "Pony Dashboard", href: "https://pony.chj.jp" },
    { id: "car", label: "Car Dashboard", href: null, comingSoon: true },
    { id: "finance", label: "Finance Dashboard", href: null, comingSoon: true },
  ],
};
