export type IconName =
  | "home"
  | "company"
  | "vacancy"
  | "tracking"
  | "report"
  | "users"
  | "logout"
  | "sun"
  | "moon"
  | "search"
  | "plus"
  | "eye"
  | "edit"
  | "more"
  | "chevron"
  | "menu"
  | "close"
  | "trash"
  | "recycle";
const paths: Record<IconName, string> = {
  recycle: "M20 7a9 9 0 0 0-15-2L2 8m0-5v5h5M4 17a9 9 0 0 0 15 2l3-3m0 5v-5h-5",
  home: "m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z",
  company: "M4 21V3h12v18M16 9h4v12M8 7h4M8 11h4M8 15h4M9 21v-2h2v2M2 21h20",
  vacancy: "M9 6V3h6v3M3 6h18v14H3ZM3 11l9 4 9-4M12 12v4",
  tracking: "M9 5h11M9 12h11M9 19h11M3 5l1 1 2-2M3 12l1 1 2-2M3 19l1 1 2-2",
  report: "M14 3H5v18h14V8ZM14 3v5h5M8 12h8M8 16h8",
  users:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8M17 4a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.87",
  logout: "M9 21H3V3h6M14 7l5 5-5 5M8 12h13",
  sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5",
  moon: "M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z",
  search: "M10.5 3a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15ZM16 16l5 5",
  plus: "M12 5v14M5 12h14",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Zm10-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z",
  edit: "m16 3 5 5M3 21l5-1L21 7a2 2 0 0 0-5-5L3 15Z",
  more: "M5 11h.01v.01H5ZM12 11h.01v.01H12ZM19 11h.01v.01H19Z",
  chevron: "m7 10 5 5 5-5",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "m6 6 12 12M6 18 18 6",
  trash: "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7",
};
export function Icon({
  name,
  className = "size-5",
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={name === "more" ? 3 : 1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
    >
      <path d={paths[name]} />
    </svg>
  );
}
