import { Composition } from "remotion";
import { Palco } from "./v9/Palco";
import { TOTAL_Q } from "./v9/tempos";

// Kivow · "Semana nova" v9.2. As prévias são trechos da MESMA composição mestre (--frames).
export const Root = () => <Composition id="SemanaV9" component={Palco} durationInFrames={TOTAL_Q} fps={60} width={1080} height={1350} />;
