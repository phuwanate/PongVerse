import { getCSRFToken, getUserAvatar, getUserId, setUserAvatar, MAX_FILE_SIZE_MB } from "./Utils.js";
export class AccountManagment extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.shadowRoot.innerHTML = this.template();
	  this.uploadAvatar =	this.uploadAvatar.bind(this)
	}

	template = () => {
		return `
			<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
			<link rel="stylesheet" href="${window.location.origin}/static/frontend/js/components/AccountManagment.css">
			
			<div class="bg-white overflow-auto custom-bg">
				<div id="header" class="fw-bold">
					<p>Account Managment</p>
				</div>
				<div id="topic" class="fw-bold">
					<p>Update Profile</p>
				</div>
				<div id="content" class="d-flex align-items-center justify-content-center">
					<div id="avatarCon" class="d-flex position-relative">
						<img id="profileImg" src="${getUserAvatar()}" 
							alt="Profile Photo"  class="position-absolute top-0 start-0 w-100 h-100"
							role="button"
							onerror="this.onerror=null; this.src='${window.location.origin+"/user-media/avatars/default.png"}';">
					</div>
					<form id="formAvatar">
						<input type="text" class="d-none" name="user_id" value="${getUserId()}">
						<input id="avatarInput" class="input-img d-none"
							type="file" value=""
							name="avatar" accept="image/*">
						<div class="ms-0">
							<button type="submit"
								class="d-flex align-items-center justify-content-center gap-2 border-0" 
								id="uploadBtn">Confirm Update
							</button>
						</div>
					</form>
				<div>
			</div>
		`;
	};

	updateAvatar(){
		const dashBoardComponent = document.getElementById('dashBoardComponent')
		let profileImg = dashBoardComponent.shadowRoot.getElementById('profileImg')
		profileImg.src = getUserAvatar()

		const profileComponent = dashBoardComponent.shadowRoot.getElementById('profileComponent')
		profileImg = profileComponent.shadowRoot.getElementById('profileImg')
		profileImg.src = getUserAvatar()
	}

	async uploadAvatar(e) {
		e.preventDefault()
		try {
			const avatarInput = this.shadowRoot.getElementById('avatarInput')
			if (!avatarInput.value) {
				alert('Click your avatar to choose a new one before confirming the update.')
				return
			}

			const csrfToken = getCSRFToken();
			if (!csrfToken) {
				throw new Error("CSRF token not found");
			}

			const form = e.target
			const formData = new FormData(form)

			const request = {
				method: 'POST',
				credentials: "same-origin",
				headers: {
					"X-CSRFToken": csrfToken
				},
				body: formData,
			}

			const access_token = document.querySelector("[name=access_token]")
			if (access_token){
				// console.log(access_token.value)
				request.headers["Authorization"] = `Bearer ${access_token.value}`
			}

			const response = await fetch(`/api/users/update_avatar`, request);

			const result = await response.json();
			if (response.status == 201){
				alert("Avatar Updated!")
				setUserAvatar(result.avatar_url)
				this.updateAvatar()
				console.log(result)
			}
			else if(response.status == 401 && result.error == 'Token has expired'){
				const refresh_token = document.querySelector("[name=refresh_token]")
				if (refresh_token){
					const newToken = await fetchJson(
						'fetchRefreshToken', 'POST', '/api/token/refresh/', {'refresh': refresh_token.value})
					// console.log(JSON.stringify(newToken))

					access_token.value = newToken.access
					sessionStorage.setItem('access_token', newToken.access)

					await fetchJson('fetchUpdateToken', 'POST', '/api/update-token', newToken)
					return await fetch(`/api/users/update_avatar`, request)
				}
				else {
					throw new Error(`${response.status} ${response.statusText} ${result.error}`)
				}
				
			}
			else {
				throw new Error(`${response.status} ${response.statusText} ${result.error}`)
			}

		}
		catch (error) {
			console.error('Error uploadAvatar:', error);
		}
	}

	connectedCallback() {
		const profileImg = this.shadowRoot.getElementById("profileImg")
		const avatarInput = this.shadowRoot.getElementById('avatarInput')
		const formAvatar = this.shadowRoot.getElementById('formAvatar')
		profileImg.addEventListener('click', ()=>{
			avatarInput.click()
		})
		avatarInput.addEventListener('change', ()=>{
			// console.log(avatarInput.value)
			if (avatarInput.value){
				//check file size
				const maxFileSize = MAX_FILE_SIZE_MB * 1024 * 1024
				if (avatarInput.files[0].size > maxFileSize) {
					
					alert(`File size exceeds the limit of ${MAX_FILE_SIZE_MB}MB`)
					avatarInput.value = ""
				} else {
					profileImg.src = URL.createObjectURL(avatarInput.files[0]);
				}
			}
			else
				profileImg.src = getUserAvatar()
		})
		formAvatar.addEventListener('submit', this.uploadAvatar)
	}

	disconnectedCallback() {
		// console.log("delete Account Managment components");
	}
}

