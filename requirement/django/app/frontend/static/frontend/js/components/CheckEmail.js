export class CheckEmailComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = this.template()
    }

    template(){
        return `
            <link rel="stylesheet" href="https://unicons.iconscout.com/release/v4.0.8/css/line.css">
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
            <link rel="stylesheet" href="${window.location.origin}/static/frontend/js/components/StyleAuthen.css">
            <div class="position-fixed top-50 start-50 translate-middle w-100 bg-white p-4 shadow overflow-auto max-75-40 r-custom">
                <h3 class="mb-3 fw-bold">Check Your Email</h3>
                <p>Please go to your email inbox and click on the activation link we have sent you to complete your registration.</p>
                <p>If you do not see the email in your inbox, please check your spam or junk folder.</p>
                <a href="/" class="btn button text-white text-decoration-none d-inline-block fs-6 border-0">Go to Homepage</a>
            </div>
            <div id="footer" class="d-flex align-items-center justify-content-center container-fluid position-fixed bottom-0 start-0">
                <p class="footer m-0">@ 2024, Made with <i class="uil uil-heart-alt"></i> by <span class="primary-color fw-bold">42 Baby Cadet</span></p>
            </div>
        `
    }
}
