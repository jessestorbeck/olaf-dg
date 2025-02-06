import { Discs, AwaitingPickup, Abandoned, Players } from "@/app/ui/icons";
import { primaryFont } from "@/app/ui/fonts";
import { fetchCardData } from "@/app/lib/data";

const icons = {
  discs: <Discs className="h-5 w-5 text-gray-700" />,
  discsAwaitingPickup: <AwaitingPickup className="h-5 w-5 text-gray-700" />,
  discsAbandoned: <Abandoned className="h-5 w-5 text-gray-700" />,
  players: <Players className="h-5 w-5 text-gray-700" />,
};

export default async function CardWrapper() {
  const {
    totalDiscs,
    totalDiscsAwaitingPickup,
    totalDiscsAbandoned,
    totalPlayers,
  } = await fetchCardData();

  return (
    <>
      <Card title="Total discs" value={totalDiscs} icon="discs" />
      <Card
        title="Discs awaiting pickup"
        value={totalDiscsAwaitingPickup}
        icon="discsAwaitingPickup"
      />
      <Card
        title="Abandoned discs"
        value={totalDiscsAbandoned}
        icon="discsAbandoned"
      />
      <Card title="Total players" value={totalPlayers} icon="players" />
    </>
  );
}

export function Card({
  title,
  value,
  icon,
}: {
  title: string;
  value: number | string;
  icon: "discs" | "discsAwaitingPickup" | "discsAbandoned" | "players";
}) {
  return (
    <div className="rounded-xl bg-gray-50 p-2 shadow-sm">
      <div className="flex p-4">
        {icons[icon]}
        <h3 className="ml-2 text-sm font-medium">{title}</h3>
      </div>
      <p
        className={`${primaryFont.className}
          rounded-xl bg-white px-4 py-8 text-center text-2xl`}
      >
        {value}
      </p>
    </div>
  );
}
