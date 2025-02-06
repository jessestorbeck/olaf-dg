import {
  Archive,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ArrowRight,
  AtSign,
  Bell,
  BellPlus,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Circle,
  CircleAlert,
  CircleHelp,
  Clock,
  Eye,
  Frown,
  History,
  Hourglass,
  House,
  Key,
  Pencil,
  Plus,
  Power,
  Trash2,
  ScrollText,
  Search,
  Settings,
  Smile,
  Star,
  Users,
  X,
} from "lucide-react";

const Discs = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 8A9 3 0 0 0 21 8" />
      <path d="M3 11A9 3 0 0 0 21 11" />
      <path d="M3 14A9 3 0 0 0 21 14" />
      <path d="M3 17A9 3 0 0 0 21 17" />
    </svg>
  );
};

export {
  Archive,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ArrowRight,
  AtSign,
  Bell as Notify,
  BellPlus as Remind,
  CalendarDays as Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Circle,
  CircleAlert,
  CircleHelp as Abandoned,
  Clock as AwaitingPickup,
  Discs,
  Eye as View,
  Frown,
  History as Restore,
  Hourglass as AddTime,
  House as Home,
  Key,
  Pencil as Edit,
  Plus as Add,
  Power,
  Trash2 as Delete,
  ScrollText as Templates,
  Search,
  Settings,
  Smile as PickedUp,
  Star as DefaultTemplate,
  Users as Players,
  X,
};
