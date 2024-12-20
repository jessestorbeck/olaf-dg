import { Libre_Baskerville } from "next/font/google";
import { Poppins } from "next/font/google";

export const logoFont = Libre_Baskerville({
  subsets: ["latin"],
  weight: "700",
});
export const primaryFont = Poppins({ subsets: ["latin"], weight: "400" });
