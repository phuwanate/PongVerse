import { fetchJson, getCSRFToken } from "./Utils.js";

export class ModalLogin extends HTMLElement {

	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.shadowRoot.innerHTML = this.template()

		// Set up the MutationObserver
		this.observer = new MutationObserver(() => this.checkVisibilityAndFocus());

	}

	template = () => {
		return `
			<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
			<link rel="stylesheet" href="./static/frontend/js/components/ModalLogin.css">

			<form id="signInForm">
				<p id="textWelcome" class="text-center fw-bold">Welcome Back</p>
				<p class="text-gray d-none d-sm-flex text-center fw-bold d-flex justify-content-center align-items-center">Enter your username and password to sign in</p>
				<div id="usernameCon" class="d-flex align-items-center justify-content-center">
					<label for="username">Username</label>
					<input class="input-css" type="text" maxlength="10"
						placeholder="Your username" id="username" 
						autocomplete="username"
						name="username" required>
				</div>
				<div id="passwordCon" class="d-flex align-items-center justify-content-center">
					<label for="password">Password</label>
					<input class="input-css" type="password" maxlength="16"
						placeholder="Your password" id="password" 
						autocomplete="current-password"
						name="password" required>
				</div>
				<button id="loginButton" class="btn container-fluid d-flex align-items-center justify-content-center" type="submit">SIGN IN</button>
			</form>
			</div>
			<div>
				<p class="text-gray text-center fw-bold">or</p>
			</div>
			<div id="signInWith">
				<p class="text-gray text-center fw-bold">Sign In with</p>
				<button id="btn42" class="btn container-fluid d-flex align-items-center justify-content-center">
					<img src="./static/frontend/images/42eco.png" alt="42 icon">
				</button>
			</div>
		`;
	}

	login = async(e)=>{
		e.preventDefault()
		try {
			const data = {
				username: this.shadowRoot.querySelector("#username").value,
				password: this.shadowRoot.querySelector("#password").value
			}
			const result = await fetchJson("login", "POST", "api/auth/login", data)
			// alert(JSON.stringify(result))
			if (result) {
				if(result.message === '2fa-qr') {
					const node = document.getElementById('firstPage'); // Example: target the node by ID
					if (node) {
						node.remove(); // Remove the node from the DOM
					}
					// document.body.innerHTML = '';
					const twoFactorAuthComponent = document.createElement('two-factor-auth-qr-component');
					twoFactorAuthComponent.id = 'myTwoFactorAuthQrComponent';
					document.body.appendChild(twoFactorAuthComponent);
				}else if(result.message === '2fa'){
					const node = document.getElementById('firstPage'); // Example: target the node by ID
					if (node) {
						node.remove(); // Remove the node from the DOM
					}
					// document.body.innerHTML = '';
					const twoFactorAuthComponent = document.createElement('two-factor-auth-component');
					twoFactorAuthComponent.id = 'myTwoFactorAuthComponent';
					document.body.appendChild(twoFactorAuthComponent);
				} 
				else {
					window.location.replace(window.location.origin + "/dashboard")
				}
			}else{
				alert(`something wrong try again`)
				this.shadowRoot.querySelector("#username").value = ""
				this.shadowRoot.querySelector("#password").value = ""
			}
		} catch (error) {
			console.error('Error signIn:', error);
		}
	}
	
	login42 = (e) => {
		e.preventDefault()
		window.location.replace(`${window.location.origin}/api/auth/login42`)	
	}

	checkVisibilityAndFocus() {
		const style = window.getComputedStyle(this);
		if (style.display !== 'none' && style.visibility !== 'hidden') {
			const username = this.shadowRoot.querySelector("input#username");
			username.focus();
		} 
		// else {
		// 	console.log('Component is not visible');
		// }
    }

	connectedCallback(){
		this.shadowRoot.getElementById("signInForm").addEventListener('submit', this.login)
		this.shadowRoot.getElementById("btn42").addEventListener('click', this.login42)

		this.observer.observe(this, { attributes: true, attributeFilter: ['style'] });
	}

	disconnectedCallback(){
		console.log("ModalLogin was gone")

		// Disconnect the observer when the element is removed from the DOM
		this.observer.disconnect();
	}
}
