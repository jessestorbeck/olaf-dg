import { Button } from "@/app/ui/button";
import { Input } from "@/app/ui/input";
import { Label } from "@/app/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/ui/popover";
import { templateVarClasses } from "@/app/lib/utils";
import { Disc } from "@/app/lib/definitions";

export function PreviewDiscPopover({
  previewDiscState,
}: {
  previewDiscState: [Disc, (disc: Disc) => void];
}) {
  const [previewDisc, setPreviewDisc] = previewDiscState;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Preview disc</Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="grid gap-2">
          <div className="grid grid-cols-4 items-center">
            <Label htmlFor="name">
              <span className={templateVarClasses.$name}>Name</span>
            </Label>
            <Input
              id="name"
              value={previewDisc.name}
              onChange={(e) =>
                setPreviewDisc({ ...previewDisc, name: e.target.value })
              }
              className="col-span-3 h-8"
            />
          </div>
          <div className="grid grid-cols-4 items-center">
            <Label htmlFor="color">
              <span className={templateVarClasses.$color}>Color</span>
            </Label>
            <Input
              id="color"
              value={previewDisc.color}
              onChange={(e) =>
                setPreviewDisc({
                  ...previewDisc,
                  color: e.target.value,
                })
              }
              className="col-span-3 h-8"
            />
          </div>
          <div className="grid grid-cols-4 items-center">
            <Label htmlFor="brand">
              <span className={templateVarClasses.$brand}>Brand</span>
            </Label>
            <Input
              id="brand"
              value={previewDisc.brand}
              onChange={(e) =>
                setPreviewDisc({
                  ...previewDisc,
                  brand: e.target.value,
                })
              }
              className="col-span-3 h-8"
            />
          </div>
          <div className="grid grid-cols-4 items-center">
            <Label htmlFor="plastic">
              <span className={templateVarClasses.$plastic}>Plastic</span>
            </Label>
            <Input
              id="plastic"
              value={previewDisc.plastic}
              onChange={(e) =>
                setPreviewDisc({
                  ...previewDisc,
                  plastic: e.target.value,
                })
              }
              className="col-span-3 h-8"
            />
          </div>
          <div className="grid grid-cols-4 items-center">
            <Label htmlFor="mold">
              <span className={templateVarClasses.$mold}>Mold</span>
            </Label>
            <Input
              id="mold"
              value={previewDisc.mold}
              onChange={(e) =>
                setPreviewDisc({ ...previewDisc, mold: e.target.value })
              }
              className="col-span-3 h-8"
            />
          </div>
          <div className="grid grid-cols-4 items-center">
            <Label htmlFor="laf">
              <span className={templateVarClasses.$laf}>LAF</span>
            </Label>
            <Input
              id="laf"
              value={previewDisc.laf}
              onChange={(e) =>
                setPreviewDisc({
                  ...previewDisc,
                  laf: e.target.value,
                })
              }
              className="col-span-3 h-8"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
