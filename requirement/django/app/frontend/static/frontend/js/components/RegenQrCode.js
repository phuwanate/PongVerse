export class RegenQrCode extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = this.template();
      this.shadowRoot.querySelector('#codeForm').addEventListener('submit', this.handleSubmit.bind(this));
      
    }
  
    handleSubmit(event) {
      event.preventDefault();
      const shadow = this.shadowRoot;
      const code = shadow.querySelector('#code').value;
      const csrf_token = document.querySelector('input[name="csrfmiddlewaretoken"]').value;

      fetch("/api/regenerate-qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrf_token,
        },
        body: JSON.stringify({ code })
      })
        .then(response => response.json())
        .then(data => {
          if (data.message === 'Regenerate QR-code Success') {
            // window.location.replace(`${window.location.origin}/api/2fa-qr-page`);
            const node = document.getElementById("regen-qr-code"); // Example: target the node by ID
            if (node) {
                console.log(node);
                node.remove(); // Remove the node from the DOM
            }
            const myTwoFactorAuthQrComponent = document.createElement('two-factor-auth-qr-component');
            myTwoFactorAuthQrComponent.id = "myTwoFactorAuthQrComponent";
            document.body.appendChild(myTwoFactorAuthQrComponent);
          } else {
            alert(data.error);
            window.location.href = "/";
          }
        })
        .catch(error => console.error("Error:", error));
    }

    template(){
      return `
          <link rel="stylesheet" href="https://unicons.iconscout.com/release/v4.0.8/css/line.css">
          <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
          <link rel="stylesheet" href="${window.location.origin}/static/frontend/js/components/StyleAuthen.css">
          <div class="position-fixed top-50 start-50 translate-middle w-100 bg-white p-4 p-sm-5 shadow overflow-autotext-center r-custom max-80-29">
            <h4 class="fw-bold">Enter the code sent to your email</h4>
            <form id="codeForm" method="post" class="mt-3 d-flex flex-row justify-content-center align-items-center">
              <label for="code" class="me-2 mt-1">Enter code:</label>
              <input type="text" maxlength="6" placeholder="Your code" id="code" class="me-2 mt-1" required>
              <input type="submit" value="Verify" class="btn button mt-1">
            </form>
          </div>
          <div id="footer" class="d-flex align-items-center justify-content-center container-fluid position-fixed bottom-0 start-0">
            <p class="footer m-0">@ 2024, Made with <i class="uil uil-heart-alt"></i> by <span class="primary-color fw-bold">42 Baby Cadet</span></p>
          </div>
      `
    }
}