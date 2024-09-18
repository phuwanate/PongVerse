export class SetupKey extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = this.template();
        this._form = this.shadowRoot.getElementById('otpForm');
        this._setupKeyElement = this.shadowRoot.getElementById('setUpKey');
        this._setupButton = this.shadowRoot.getElementById('setUpBtn');
    }

    connectedCallback() {
        this._form.addEventListener('submit', this._onSubmit.bind(this));
        this._setupButton.addEventListener('click', this._copyToClipboard.bind(this));
        this._fetchSetupKey();
    }

    disconnectedCallback() {
        this._form.removeEventListener('submit', this._onSubmit.bind(this));
        this._setupButton.removeEventListener('click', this._copyToClipboard.bind(this));
    }

    _onSubmit(event) {
        event.preventDefault();
        const otp = this.shadowRoot.getElementById('otp').value;
        const csrfToken = document.querySelector('input[name="csrfmiddlewaretoken"]').value;

        fetch("/api/verify_totp/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrfToken
            },
            body: JSON.stringify({ otp })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === 'Login success') {
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

    _fetchSetupKey() {
        fetch("/api/get-totp")
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log("Received data:", data);
                this._setupKeyElement.textContent = data.key;
            })
            .catch(error => {
                console.error("Fetch error:", error);
            });
    }

    _copyToClipboard() {
        const setupKey = this._setupKeyElement.textContent;
        const tempInput = document.createElement('textarea');
        tempInput.value = setupKey;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        alert('Setup key copied to clipboard!');
    }

    template(){
        return `
            <link rel="stylesheet" href="https://unicons.iconscout.com/release/v4.0.8/css/line.css">
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
            <link rel="stylesheet" href="${window.location.origin}/static/frontend/js/components/StyleAuthen.css">
            <div class="position-fixed top-50 start-50 translate-middle w-100 bg-white p-4 p-sm-5 shadow overflow-auto text-center r-custom max-80-30">
                <h3 class="fw-bold">Two-Factor Authentication</h3>
                <input type="hidden" id="setUpKey">
                <button id="setUpBtn" class="btn button">🔐 <strong>Setup Key</strong></button>
                <form id="otpForm" class="mt-3 d-flex flex-row justify-content-center align-items-center">
                    <label for="otp" class="me-2 mt-1">Enter OTP:</label>
                    <input type="text" maxlength="6" placeholder="Your OTP" id="otp" class="me-2 mt-1" name="otp" required>
                    <input type="submit" value="Verify" class="btn button mt-1">
                </form>
                <p class="small mt-3 mb-0">Check the OTP in your authenticator application</p>
                <a href="https://support.google.com/accounts/answer/1066447?hl=th&co=GENIE.Platform%3DiOS&oco=1" target="_blank" id="learnMore">Learn more</a>
            </div>
            <div id="footer" class="d-flex align-items-center justify-content-center container-fluid position-fixed bottom-0 start-0">
                <p class="footer m-0">@ 2024, Made with <i class="uil uil-heart-alt"></i> by <span class="primary-color fw-bold">42 Baby Cadet</span></p>
            </div>
        `
    }
}
