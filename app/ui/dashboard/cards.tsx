import {
  BanknotesIcon,
  ClockIcon,
  UserGroupIcon,
  InboxIcon,
} from "@heroicons/react/24/outline";
import { primaryFont } from "@/app/ui/fonts";
import { fetchCardData } from "@/app/lib/data";

const iconMap = {
  collected: BanknotesIcon,
  players: UserGroupIcon,
  pending: ClockIcon,
  discs: InboxIcon,
};

export default async function CardWrapper() {
  const { numberOfDiscs, numberOfPlayers, totalPaidDiscs, totalPendingDiscs } =
    await fetchCardData();

  return (
    <>
      <Card title="Collected" value={totalPaidDiscs} type="collected" />
      <Card title="Pending" value={totalPendingDiscs} type="pending" />
      <Card title="Total Discs" value={numberOfDiscs} type="discs" />
      <Card title="Total Players" value={numberOfPlayers} type="players" />
    </>
  );
}

export function Card({
  title,
  value,
  type,
}: {
  title: string;
  value: number | string;
  type: "discs" | "players" | "pending" | "collected";
}) {
  const Icon = iconMap[type];

  return (
    <div className="rounded-xl bg-gray-50 p-2 shadow-sm">
      <div className="flex p-4">
        {Icon ?
          <Icon className="h-5 w-5 text-gray-700" />
        : null}
        <h3 className="ml-2 text-sm font-medium">{title}</h3>
      </div>
      <p
        className={`${primaryFont.className}
          truncate rounded-xl bg-white px-4 py-8 text-center text-2xl`}
      >
        {value}
      </p>
    </div>
  );
}
