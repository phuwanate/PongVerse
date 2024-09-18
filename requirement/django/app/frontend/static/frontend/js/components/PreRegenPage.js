export class PreRegenPage extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = this.template()
        this._form = this.shadowRoot.getElementById('emailForm');
    }

    connectedCallback() {
        this._form.addEventListener('submit', this._onSubmit.bind(this));

    }

    disconnectedCallback() {
        this._form.removeEventListener('submit', this._onSubmit.bind(this));
    }

    _onSubmit(event) {
        event.preventDefault();
        this._form.querySelector('input[type="submit"]').disabled = true;
        const form = event.target;
        const formData = new FormData(form);
        const csrf_token = document.querySelector('input[name="csrfmiddlewaretoken"]').value;

        fetch(form.action, {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': csrf_token
            }
        })
        .then(response => response.json())
        .then(data => {
            console.log(
             " before /api/recover-qr",data
            )
            if (data.success) {

                fetch('/api/recover-qr',{
                    method: 'GET',
                    headers:{
                        'X-CSRFToken': csrf_token
                    }
                })
                .then(reponse => reponse.json())
                .then(data =>{
                    if(data.message === "Good morning")
                    {       
                        console.log("success pre")
                        const node = document.getElementById("preRegenPage"); // Example: target the node by ID
                        if (node) {
                            console.log(node);
                            node.remove(); // Remove the node from the DOM
                        }
                        const myTwoFactorAuthQrComponent = document.createElement('regen-qr-code');
                        myTwoFactorAuthQrComponent.id = "regen-qr-code";
                        document.body.appendChild(myTwoFactorAuthQrComponent);

                    }
                    else{
                        alert(data.error);
                        location.replace(`${window.location.origin}/`);
                    }
                })
            } else {
                alert(data.error);
                location.replace(`${window.location.origin}/`);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }

    template(){
        return `
            <link rel="stylesheet" href="https://unicons.iconscout.com/release/v4.0.8/css/line.css">
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
            <link rel="stylesheet" href="${window.location.origin}/static/frontend/js/components/StyleAuthen.css">
            <div class="position-fixed top-50 start-50 translate-middle w-100 bg-white p-4 p-sm-5 shadow overflow-auto text-center r-custom max-80-36">
                <h4 class="fw-bold">Fill your email for sending regenerate code</h4>
                <form id="emailForm" action="/api/pre-regen" method="post" class="mt-3 d-flex flex-row justify-content-center align-items-center">
                    <label for="email" class="me-2 mt-1">Email:</label>
                    <input type="email" maxlength="100" placeholder="Your email" id="email" class="me-2 mt-1" name="email" required>
                    <input type="submit" value="Submit" class="btn button mt-1">
                </form>
            </div>
            <div id="footer" class="d-flex align-items-center justify-content-center container-fluid position-fixed bottom-0 start-0">
                <p class="footer m-0">@ 2024, Made with <i class="uil uil-heart-alt"></i> by <span class="primary-color fw-bold">42 Baby Cadet</span></p>
            </div>
        `
    }
}

