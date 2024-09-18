export class FirstPage extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.shadowRoot.innerHTML = this.template();
	}

	template = () => {
		return `
			<link rel="stylesheet" href="https://unicons.iconscout.com/release/v4.0.8/css/line.css">
			<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
			<link rel="stylesheet" href="./static/frontend/js/components/firstPage.css">
			
			<div id="nav" class="d-flex align-items-center justify-content-center container-fluid position-relative">
				<div id="ืnavBg" class="d-flex align-items-center justify-content-center container-fluid h-5">
					<div id="navTextJoin" class="d-flex align-items-center">
						<button id="signInBtn" class="btn btn-light">SIGN IN</button>
						<p class="text-light d-none d-sm-flex">to join the TOURNAMENT !</p>
					</div>
					<div class="d-flex align-items-center ms-0">
						<p class="text-light d-none d-sm-flex mb-0">or</p>
						<button id="signUpBtn" class="btn btn-light ms-3">SIGN UP</button>
					</div>
				</div>
			</div>
			
			<div id="gameTag" class="container-fluid mb-0">
				<!--pong-offline-component></pong-offline-component-->
				<pong-all-offline-component></pong-all-offline-component>
			</div>
			
			<div id="footer" class="d-flex align-items-center justify-content-center container-fluid position-fixed bottom-0 start-0 bg-transparent">
				<p>
					@ 2024, Made with 
					<i class="uil uil-heart-alt"></i> 
					by 
					<span class="fw-bold">42 Baby Cadet</span>
				</p>
			</div>

			<modal-login-component id="modalLoginComponent" class="position-fixed top-50 start-50 translate-middle w-75 bg-white p-3 shadow"></modal-login-component>
			<modal-sign-up-component id="modalSignUpComponent" class="position-fixed top-50 start-50 translate-middle w-75 mw-500 bg-white p-3 shadow"></modal-sign-up-component>
		`;
	};

	toggleModal = (modalId) => {
		const noneDisplayAllModal = () => {
			this.shadowRoot.getElementById("modalLoginComponent").style.display = "none"
			this.shadowRoot.getElementById("modalSignUpComponent").style.display = "none"
		}

		const modal = this.shadowRoot.getElementById(modalId)

		if (modal.style.display == "block") {
			noneDisplayAllModal()
		} else {
			noneDisplayAllModal()
			modal.style.display = "block"
		}
	}

	connectedCallback() {

		this.shadowRoot.getElementById("signInBtn").addEventListener("click", () => {
			this.toggleModal("modalLoginComponent")
		})

		this.shadowRoot.getElementById("signUpBtn").addEventListener("click", () => {
			this.toggleModal("modalSignUpComponent")
		})
	}
}
