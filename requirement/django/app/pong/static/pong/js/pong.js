import { PublicPong } from "./components/PublicPong.js";
import { TourBroadcast } from "./components/TourBroadcast.js"
import { PongPrivateMatch } from "./components/PongPrivateMatch.js"
import { PongTourMatch } from "./components/PongTourMatch.js";
import { PongBase, Pong, PongOffline, PongAllAI, PongAI, PongAllOffline } from "./components/Pong.js"
import { PongPlayer } from "./components/PongPlayer.js"
import { WaitMatchBase, WaitMatch, Final } from "./components/WaitMatch.js"

customElements.define('public-pong-component', PublicPong)
customElements.define("toutnament-broadcast-component", TourBroadcast)
customElements.define("pong-private-match-component", PongPrivateMatch)
customElements.define("pong-tour-match-component", PongTourMatch)
customElements.define("pong-component", Pong)
customElements.define("pong-base-component", PongBase)
customElements.define("pong-offline-component", PongOffline)
customElements.define("pong-ai-component", PongAI)
customElements.define("pong-all-ai-component", PongAllAI)
customElements.define("pong-all-offline-component", PongAllOffline)
customElements.define("pong-player-component", PongPlayer)
customElements.define("wait-match-component", WaitMatch)
customElements.define("wait-match-base-component", WaitMatchBase)
customElements.define("final-component", Final)