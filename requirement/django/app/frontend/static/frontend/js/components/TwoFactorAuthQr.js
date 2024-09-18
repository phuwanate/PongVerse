export class TwoFactorAuthQr extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = this.template();
        this.otpForm = this.shadowRoot.querySelector('#otpForm');
        this.otpForm.addEventListener('submit', this.handleOtpSubmit.bind(this));
        this.setUpKey = this.shadowRoot.querySelector('#setUpKey');
        this.setUpKey.addEventListener('submit', this.handleSetupKey.bind(this));
    }

    connectedCallback() {
        fetch("/api/get_csrf_token_and_session_id/",{
            method: "GET",
        })
        .then(response => response.json())
        .then(data=>{
            document.querySelector('input[name="csrfmiddlewaretoken"]').value = data["csrf_token"];
        })
        
    }

    handleSetupKey(event){
        event.preventDefault();
        const node = document.getElementById("myTwoFactorAuthQrComponent"); // Example: target the node by ID
        if (node) {
            console.log(node);
            node.remove(); // Remove the node from the DOM
        }
        const setUpKeyComponent = document.createElement('set-up-key-component');
        setUpKeyComponent.id = "setUpKeyComponent";
        document.body.appendChild(setUpKeyComponent);
    }

    handleOtpSubmit(event) {
        event.preventDefault();
        const otp = this.shadowRoot.getElementById('otp').value;
        const csrfToken = document.querySelector('input[name="csrfmiddlewaretoken"]').value;
        console.log(csrfToken);
        fetch("/api/verify_totp/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrfToken
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

    template(){
        return `
            <link rel="stylesheet" href="https://unicons.iconscout.com/release/v4.0.8/css/line.css">
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
            <link rel="stylesheet" href="${window.location.origin}/static/frontend/js/components/StyleAuthen.css">
            <div class="position-fixed top-50 start-50 translate-middle w-100 bg-white p-4 p-sm-5 shadow overflow-auto text-center r-custom max-100-30">
                <h3 class="fw-bold">Two-Factor Authentication</h3>
                <div class="m-0">
                    <img src="/api/generate-qr" alt="QR Code">
                </div>
                <form id="setUpKey">
                    <button type="submit" class="btn button fs-6">Use setup key</button>
                </form>
                <form id="otpForm" action="/api/verify_totp/" method="post" class="mt-3 d-flex flex-row justify-content-center align-items-center">
                    <label for="otp" class="me-2 mt-1">Enter OTP:</label>
                    <input type="text" maxlength="6" placeholder="Your OTP" id="otp" class="me-2 mt-1" name="otp" required>
                    <input type="submit" value="Verify" class="btn button mt-1">
                </form>
                <p class="small mt-3 mb-0">Check the OTP in your authenticator application</p>
                <a href="https://support.google.com/accounts/answer/1066447?hl=th&co=GENIE.Platform%3DiOS&oco=1" target=_blank id="learnMore">Learn more</a>
            </div>
            <div id="footer" class="d-flex align-items-center justify-content-center container-fluid position-fixed bottom-0 start-0">
                <p class="footer m-0">@ 2024, Made with <i class="uil uil-heart-alt"></i> by <span class="primary-color fw-bold">42 Baby Cadet</span></p>
            </div>
        `
    }
}

