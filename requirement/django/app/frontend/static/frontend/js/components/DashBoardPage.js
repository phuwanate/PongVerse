import { getUserAvatar, getUserName } from "./Utils.js"

export class DashBoardPage extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.shadowRoot.innerHTML = this.template()
	}

	navBar(){
		return `
			<div class="position-sticky top-0 z-1">
				<div id="nav" class=" d-flex justify-content-between align-items-center w-100 position-relative ps-3 pe-3 bg-default">				
					<div class="d-flex align-items-center">
						<div id="navMenu" class="rounded-0 align-items-center justify-content-center d-flex d-xl-none me-3">
							<i class="uil uil-bars fs-4 dark-gray"></i>
						</div>
						<div id="navLogo" class="d-none d-xl-flex align-items-center">
							<i class="uil uil-window-grid dark-gray fs-4"></i>
							<p class="mb-0 ms-2 fw-bold fs-6 dark-gray">DASHBOARD</p>
						</div>
					</div>
					<div class="d-none d-sm-flex">
						<div class="buttons">
							<button type="button" class="button active" data-fontsize="16">A</button>
							<button type="button" class="button" data-fontsize="20">A</button>
							<button type="button" class="button" data-fontsize="23">A</button>
						</div>
					</div>
					<div id="navProfile" class="d-flex align-items-center">
						<div id="navProfileName" class="me-2 fw-bold fs-7 dark-gray ">
							${getUserName()}
						</div>
						<div id="navProfileAvatar">
							<img src="${getUserAvatar()}" 
								 alt="Profile Photo" id="profileImg"
								 class="rounded"
								 onerror="this.onerror=null; this.src='${window.location.origin+"/user-media/avatars/default.png"}';">
						</div>
					</div>
				</div>
			</div>
		`
	}

	template = () => {
		return `
			<link rel="stylesheet" href="https://unicons.iconscout.com/release/v4.0.8/css/line.css">
			<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
			<link rel="stylesheet" href="${window.location.origin}/static/frontend/js/components/DashBoardPage.css">
			
			${this.navBar()}
			<div id="body" class="d-flex bg-default overflow-auto">
				<profile-component id="profileComponent" class="body-left"></profile-component>
				<div id="bodyMiddle" class="bg-default">
					<public-pong-component id="pongPublic"></public-pong-component>
					<div id="mainFrame">
						<!--notification-component></notification-component-->
						<account-management-component></account-management-component>
					</div>

					</div>
				<div id="bodyRight" class="bg-default">
					<friends-component id="friendsComponent"></friends-component>
					<live-chat-component id="liveChatComponent"></live-chat-component>
				</div>
			</div>

			<div id="footer" class="d-none d-md-flex align-items-center justify-content-center container-fluid position-fixed bottom-0 start-0">
				<p class="medium-gray fs-8 m-0">
					@ 2024, Made with 
					<i class="uil uil-heart-alt"></i> 
					by 
					<span class="primary-color fw-bold">42 Baby Cadet</span>
				</p>
			</div>
		`;
	}

	connectedCallback() {
		const menuButton = this.shadowRoot.getElementById('navMenu');
		const profile = this.shadowRoot.getElementById('profileComponent');

		menuButton.addEventListener('click', function(event) {
			profile.style.display = profile.style.display === 'block' ? 'none' : 'block';
			event.stopPropagation(); // Prevent click event from bubbling up
		});

		document.addEventListener('click', function(event) {
			if (!profile.contains(event.target) && event.target !== menuButton) {
				if (window.outerWidth < 1200)
					profile.style.display = 'none';
			}
		});
		
		const handleResize = () => {
			if (window.outerWidth >= 1200) profile.style.display = 'block';
			else profile.style.display = 'none';

			if (window.outerWidth < 575) {
				document.querySelector('html').style.fontSize = '16px';
			} else {
				const activeButton = this.shadowRoot.querySelector('.buttons .button.active');
				const defaultFontSize = activeButton ? activeButton.getAttribute('data-fontsize') : '16';
				document.querySelector('html').style.fontSize = `${defaultFontSize}px`;
			}
		}

		window.addEventListener('resize', handleResize)

		const buttons = this.shadowRoot.querySelector('.buttons');
		const buttonElements = buttons.querySelectorAll('.button');

		const fontchange = (size) => {
			document.querySelector('html').style.fontSize = size + 'px';
		};
		buttonElements.forEach(button => {
			button.addEventListener('click', function() {
				const currentActive = buttons.querySelector('.button.active');
				if (currentActive) {
					currentActive.classList.remove('active');
				}
				this.classList.add('active');
				const fontSize = this.getAttribute('data-fontsize');
				fontchange(fontSize);
			});
		});
	}

	disconnectedCallback(){
		window.removeEventListener('resize', handleResize)
	}
}