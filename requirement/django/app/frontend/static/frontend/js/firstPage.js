import { FirstPage } from "./components/FirstPage.js";
import { ModalLogin } from "./components/ModalLogin.js";
import { ModalSignUp } from "./components/ModalSignUp.js"
import { CheckEmailComponent } from "./components/CheckEmail.js";
import { TwoFactorAuthComponent } from "./components/TwoFactorAuth.js";
import { TwoFactorAuthQr } from "./components/TwoFactorAuthQr.js";
// import { QrCode } from "./components/qrCode.js"
import { PreRegenPage } from "./components/PreRegenPage.js";
import { SetupKey } from "./components/SetupKey.js";
import {RegenQrCode} from "./components/RegenQrCode.js";

customElements.define('first-page-component', FirstPage)
customElements.define('modal-login-component', ModalLogin)
customElements.define('modal-sign-up-component', ModalSignUp)
customElements.define('check-email-component',CheckEmailComponent);
customElements.define('two-factor-auth-component',TwoFactorAuthComponent);
customElements.define('two-factor-auth-qr-component',TwoFactorAuthQr);
// customElements.define('qr-code-component', QrCode);
customElements.define('pre-regen-page-component', PreRegenPage);
customElements.define('set-up-key-component',SetupKey);
customElements.define('regen-qr-code',RegenQrCode);

