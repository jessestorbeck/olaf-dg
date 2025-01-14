import { UpdateDisc, DeleteDiscs } from "@/app/ui/discs/action-buttons";
import DiscStatus from "@/app/ui/discs/status";
import { formatDate } from "@/app/lib/utils";
import { fetchFilteredDiscs } from "@/app/lib/data";

export default async function DiscsTable({
  query,
  currentPage,
}: {
  query: string;
  currentPage: number;
}) {
  const discs = await fetchFilteredDiscs(query, currentPage);

  return (
    <div className="mt-6 flow-root">
      <div className="inline-block min-w-full align-middle">
        <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
          <div className="md:hidden">
            {discs?.map((disc) => (
              <div
                key={disc.id}
                className="mb-2 w-full rounded-md bg-white p-4"
              >
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <div className="mb-2 flex items-center">
                      <p>{disc.name}</p>
                    </div>
                    <p className="text-sm text-gray-500">{disc.phone}</p>
                  </div>
                  <DiscStatus status={disc.status} />
                </div>
                <div className="flex w-full items-center justify-between pt-4">
                  <div>
                    <p>{formatDate(disc.created_at)}</p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <UpdateDisc id={disc.id} />
                    <DeleteDiscs ids={[disc.id]} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <table className="hidden min-w-full text-gray-900 md:table">
            <thead className="rounded-lg text-left text-sm font-normal">
              <tr>
                <th scope="col" className="px-4 py-5 font-medium sm:pl-6">
                  Name
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Phone
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Color
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Brand
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Plastic
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Mold
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Date
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Held Until
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Location
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Status
                </th>
                <th scope="col" className="relative py-3 pl-6 pr-3">
                  <span className="sr-only">Edit</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {discs?.map((disc) => (
                <tr
                  key={disc.id}
                  className="w-full border-b py-3 text-sm last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg"
                >
                  <td className="whitespace-nowrap py-3 pl-6 pr-3">
                    <div className="flex items-center gap-3">
                      <p>{disc.name}</p>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">{disc.phone}</td>
                  <td className="whitespace-nowrap px-3 py-3">{disc.color}</td>
                  <td className="whitespace-nowrap px-3 py-3">{disc.brand}</td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {disc.plastic}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">{disc.mold}</td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {formatDate(disc.created_at)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {disc.held_until ? formatDate(disc.held_until) : ""}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {disc.location}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <DiscStatus status={disc.status} />
                  </td>
                  <td className="whitespace-nowrap py-3 pl-6 pr-3">
                    <div className="flex justify-end gap-3">
                      <UpdateDisc id={disc.id} />
                      <DeleteDiscs ids={[disc.id]} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
