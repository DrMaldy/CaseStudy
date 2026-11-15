import type { RenderModel } from "@/lib/werbemittel/render-model";
import { SocialKlassisch } from "./social-klassisch";
import { SocialFoto } from "./social-foto";
import { SocialVollbild } from "./social-vollbild";
import { FlyerStandard } from "./flyer-standard";

const KOMPONENTEN: Record<string, (p: { m: RenderModel }) => React.ReactElement> = {
  "social-klassisch": SocialKlassisch,
  "social-foto": SocialFoto,
  "social-vollbild": SocialVollbild,
  "flyer-standard": FlyerStandard,
};

export function WerbemittelMotiv({ model }: { model: RenderModel }) {
  const Vorlage = KOMPONENTEN[model.vorlage];
  return <Vorlage m={model} />;
}
