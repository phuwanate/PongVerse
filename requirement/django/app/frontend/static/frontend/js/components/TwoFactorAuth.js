export class TwoFactorAuthComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({mode: 'open'});
        this.shadowRoot.innerHTML = this.template();
    }

    connectedCallback() {
        fetch("/api/get_csrf_token_and_session_id/",{
            method: "GET",
        })
        .then(response => response.json())
        .then(data=>{
            document.querySelector('input[name="csrfmiddlewaretoken"]').value = data["csrf_token"];
            console.log(data["csrf_token"]);
        })
        
        this.shadowRoot.querySelector('#otpForm').addEventListener('submit', this.verifyOTP.bind(this));
        this.shadowRoot.querySelector('#regenForm').addEventListener('submit', this.regenerateQRCode.bind(this));
    }

    disconnectedCallback() {
        this.shadowRoot.querySelector('#otpForm').removeEventListener('submit', this.verifyOTP.bind(this));
        this.shadowRoot.querySelector('#regenForm').removeEventListener('submit', this.regenerateQRCode.bind(this));
    }

    verifyOTP(event) {
        event.preventDefault();
        const otp = this.shadowRoot.querySelector('#otp').value;

        fetch("/api/verify_totp/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken":  document.querySelector('input[name="csrfmiddlewaretoken"]').value
            },
            body: JSON.stringify({ otp: otp })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === 'Login success') {
                // Save tokens to sessionStorage
                sessionStorage.setItem('access_token', data.access);
                sessionStorage.setItem('refresh_token', data.refresh);
                console.log("Access Token:", sessionStorage.getItem('access_token'));
                console.log("Refresh Token:", sessionStorage.getItem('refresh_token'));

                window.location.replace(`${window.location.origin}/dashboard`);
            } else {
                alert(data.error);
                window.location.replace(`${window.location.origin}/`);
            }
        })
        .catch(error => console.error("Error:", error));
    }

    regenerateQRCode(event) {
        event.preventDefault();
        const node = document.getElementById("myTwoFactorAuthComponent"); // Example: target the node by ID
        if (node) {
            console.log(node);
            node.remove(); // Remove the node from the DOM
        }
        // document.body.innerHTML = '';
        const preRegenComponent = document.createElement('pre-regen-page-component');
        preRegenComponent.id = "preRegenPage";
        document.body.appendChild(preRegenComponent);
        // window.location.href = "/api/pre-regenerate-qr-code";
    }

    template(){
        return `
            <link rel="stylesheet" href="https://unicons.iconscout.com/release/v4.0.8/css/line.css">
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
            <link rel="stylesheet" href="${window.location.origin}/static/frontend/js/components/StyleAuthen.css">
            <div class="position-fixed top-50 start-50 translate-middle w-100 bg-white p-4 p-sm-5 shadow overflow-auto text-center r-custom max-80-30">
                <h3 class="fw-bold">Two-Factor Authentication</h3>
                <form id="otpForm" class="mt-3 d-flex flex-row justify-content-center align-items-center p-0 container">
                    <label for="otp" class="me-2 mt-1">Enter OTP:</label>
                    <input type="text" maxlength="6" placeholder="Your OTP" id="otp" class="me-2 mt-1" name="otp" required>
                    <input type="submit" value="Verify" class="btn button mt-1">
                </form>
                <form id="regenForm">
                    <button type="submit" id="regenBtn" class="btn button mt-4 mb-0">regenerate QR-code</button>
                </form>
                <a href="https://support.google.com/accounts/answer/1066447?hl=th&co=GENIE.Platform%3DiOS&oco=1" target="_blank" id="learnMore">Learn more</a>
            </div>
            <div id="footer" class="d-flex align-items-center justify-content-center container-fluid position-fixed bottom-0 start-0">
                <p class="footer m-0">@ 2024, Made with <i class="uil uil-heart-alt"></i> by <span class="primary-color fw-bold">42 Baby Cadet</span></p>
            </div>
        `
    }
}


