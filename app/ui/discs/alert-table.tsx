import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/ui/table";
import { Disc } from "@/app/lib/definitions";
import { formatPhone } from "@/app/lib/utils";

export function AlertTable({ discs }: { discs: Disc[] }) {
  return (
    <div className="max-h-48 overflow-y-scroll my-4">
      <Table className="w-full">
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Color</TableHead>
            <TableHead>Brand</TableHead>
            <TableHead>Plastic</TableHead>
            <TableHead>Mold</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {discs.map((disc) => (
            <TableRow key={disc.id}>
              <TableCell>{disc.name}</TableCell>
              <TableCell>{formatPhone(disc.phone)}</TableCell>
              <TableCell>{disc.color}</TableCell>
              <TableCell>{disc.brand}</TableCell>
              <TableCell>{disc.plastic}</TableCell>
              <TableCell>{disc.mold}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
