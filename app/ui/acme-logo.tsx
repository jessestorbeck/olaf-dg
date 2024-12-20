import { logoFont } from "@/app/ui/fonts";

export default function AcmeLogo() {
  return (
    <div
      className={`${logoFont.className} flex flex-row items-center leading-none text-white`}
    >
      <p className="text-[44px]">Olaf</p>
    </div>
  );
}
