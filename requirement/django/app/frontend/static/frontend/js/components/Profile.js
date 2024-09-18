import { addNavigate, fetchJson, getMainFrame, getUserAvatar, getUserName } from "./Utils.js";

export class Profile extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.shadowRoot.innerHTML = this.template();
	}

	template = () => {
		return `
			<link rel="stylesheet" href="https://unicons.iconscout.com/release/v3.0.6/css/line.css">
			<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
			<link rel="stylesheet" href="${window.location.origin}/static/frontend/js/components/profile.css">
			
			<div id="avatarCon" class="d-none d-md-flex position-relative w-100">
				<img id="profileImg" src="${getUserAvatar()}" alt="Profile Photo"  class="position-absolute top-0 start-0 w-100 h-100"
					onerror="this.onerror=null; this.src='${window.location.origin+"/user-media/avatars/default.png"}';">
			</div>
			<div id="profileName" class="d-none d-md-flex position-relative p-2 bg-white rounded-3 align-items-center justify-content-center my-3 w-100">
				<h4 class="fs-6 mt-0 mb-0 dark-text">${getUserName()}</h4>
			</div>
			<div id="sideBar" class="d-block mb-4">
				<div class="sidebar-item link-target" id="accountManagementLink" data-url="account-management" data-title="Baby cadet acount management">
					<span><i class="uil uil-user sidebar-icon my-0 mx-2"></i></span>
					<h3 class="sidebar-text">Account</h3>
				</div>
				<div class="sidebar-item link-target" id="notificationLink" data-url="notification" data-title="Baby cadet notification">
					<span><i class="uil uil-bell sidebar-icon my-0 mx-2"></i></span>
					<h3 class="sidebar-text">Notifications</h3>
				</div>
				<a class="sidebar-item link-target" id="statisticLink" data-url="statistic" data-title="Baby cadet statistic">
					<span><i class="uil uil-chart-bar sidebar-icon my-0 mx-2"></i></span>
					<h3 class="sidebar-text">Statistic</h3>
				</a>
				<a class="sidebar-item link-target" id="matchHistoryLink" data-url="match-history" data-title="Baby cadet match history">
					<span><i class="uil uil-file-alt sidebar-icon my-0 mx-2"></i></span>
					<h3 class="sidebar-text">Match History</h3>
				</a>
				<a class="sidebar-item link-target" id="blockedListLink" data-url="blocked-list" data-title="Baby cadet blocked list">
					<span><i class="uil uil-envelope-block sidebar-icon my-0 mx-2"></i></span>
					<h3 class="sidebar-text">Blocked List</h3>
				</a>
				<a class="sidebar-item" id="logOut">
					<span><i class="uil uil-signout sidebar-icon my-0 mx-2"></i></span>
					<h3 class="sidebar-text">Log Out</h3>
				</a>
			</div>
			<div id="offlinePong" class="d-block align-items-center p-3">
				<span><i class="uil uil-question-circle sidebar-icon m-0:"></i></span>
				<div id="content" class="my-2">
					<h3 class="d-flex fw-bold text-white fs-7 mt-2 mb-0">Need Practice?</h3>
					<small class="text-white fs-8">Play with friend!</small>
				</div>
				<button id="playOffline" class="btn btn-light dark-text w-100">Play OFFLINE</button>
			</div>
		`;
	};

	logOut = async() => {
		const result = await fetchJson("logOut", "POST", `${window.location.origin}/api/auth/logout`)
		if (result) window.location.replace(window.location.origin)
	}

	connectedCallback() {		
		this.shadowRoot.querySelector("#logOut").addEventListener("click", this.logOut)

		document.addEventListener('DOMContentLoaded', () => {
			const parent = this.parentNode.parentNode
			const mainFrame = parent.getElementById("mainFrame")

			this.shadowRoot.querySelectorAll('.link-target').forEach(item => addNavigate(item, mainFrame));
		});

		this.shadowRoot.getElementById("playOffline").addEventListener('click', ()=>{
			const mainFrame = getMainFrame()
			mainFrame.innerHTML = '<pong-all-offline-component></pong-all-offline-component>'
		})
	}
}
