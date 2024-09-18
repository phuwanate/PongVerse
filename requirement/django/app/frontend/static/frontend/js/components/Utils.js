export const MAX_FILE_SIZE_MB = 1

export function	getCSRFToken () {
	const csrfTokenElement = document.querySelector("[name=csrfmiddlewaretoken]");
	// console.log(csrfTokenElement);
	return csrfTokenElement ? csrfTokenElement.value : null;
};

export function getUserId () {
	const ownerId = document.querySelector("[name=owner_id]");
	return ownerId ? ownerId.value : null;
}

export function getUserAvatar() {
	const avatar = document.querySelector("[name=avatar]");
	return avatar ? avatar.value : null;
}

export function setUserAvatar(avatarUrl) {
	const avatar = document.querySelector("[name=avatar]");
	if (avatar)
		avatar.value = avatarUrl
}

export function getUserName() {
	const username = document.querySelector("[name=username]");
	return username ? username.value : null;
}

export function getSessionID() {
	const session_id = document.querySelector("[name=session_id]");
	return session_id ? session_id.value : null;
}

/*
** element is link item
** target is element to expect change inner html eg. mainframe
** props to send when create element
*/
export function addNavigate(element, target) {
	// Function to load content dynamically
	const loadContent = (url, props ={}) => {
		// Fetch content from server or set it directly
		// For demo purposes, let's just set it directly
		const content = {
			'account-management': '<account-management-component id="accountManagementComponent"></account-management-component>',
			'notification': '<notification-component id="notificationComponent"></notification-component>',
			'statistic': '<statistic-component id="statisticComponent"></statistic-component>',
			'match-history': '<match-history-component id="matchHistoryComponent"></match-history-component>',
			'blocked-list': '<blocked-list-component id="blockedListComponent"></blocked-list-component>',
			'recommend-friend': '<recommend-friend-component id="recommendFriendComponent"></recommend-friend-component>',
			'friend-profile': `<friend-profile-component id="friendProfileComponent" data-user="${props.user || ''}"></friend-profile-component>`
		};
		target.innerHTML = content[url] || 'Content not found';

		// Pass props to the loaded content
		if (url === 'friend-profile' && props.user) {
			const friendProfileComponent = target.querySelector('#friendProfileComponent');
			friendProfileComponent.setAttribute('data-user', props.user);
			// You can add more props as needed
		}
	}

	// Function to handle navigation
	const navigate = (el) => {
		const url = el.getAttribute('data-url');
		const title = el.getAttribute('data-title') || "Baby cadet no content";

		// Get context data for specific urls
		const props = {};
		if (url === 'friend-profile') {
			props.user = el.getAttribute('data-user');
			// console.log(props.user)
		}

		// Push state to history
		// history.pushState({url: url}, title, `/${url}`);
		// do not put url to address bar because when refresh it take 404
		history.pushState({url: url, props: props}, title);
		document.title = title; // Change the document title

		// Load the content
		loadContent(url, props);
		
		//debug
		// console.log(element)
	}

	// Attach click event listener to navigation items
	element.addEventListener('click', () => navigate(element));

	// Handle back/forward button
	window.addEventListener('popstate', (event) => {
		if (event.state) {
			loadContent(event.state.url, event.state.props);
		}
	});
}

export async function fetchJson(name, method, url, payload = null){
	try {
		const csrfToken = getCSRFToken();
		if (!csrfToken) {
			throw new Error("CSRF token not found");
		}

		const request = {
			method: method,
			credentials: "same-origin",
			headers: {
				"X-CSRFToken": csrfToken,
			},
		}

		/** playload: json */
		if (payload) {
			request.headers["Content-Type"] = "application/json"
			request.body = JSON.stringify(payload)
		}

		const access_token = document.querySelector("[name=access_token]")
		if (access_token){
			// console.log(access_token.value)
			request.headers["Authorization"] = `Bearer ${access_token.value}`
		}

		let response = await fetch(url, request);

		let result = await response.json()

		if (!response.ok) {
			if (result.error == 'Token has expired'){
				// console.log(result)
				const refresh_token = document.querySelector("[name=refresh_token]")
				if (refresh_token){
					const newToken = await fetchJson(
						'fetchRefreshToken', 'POST', '/api/token/refresh/', {'refresh': refresh_token.value})
					// console.log(JSON.stringify(newToken))

					access_token.value = newToken.access
					sessionStorage.setItem('access_token', newToken.access)

					await fetchJson('fetchUpdateToken', 'POST', '/api/update-token', newToken)
					return await fetchJson(name, method, url, payload)
				}
			}
			throw new Error(`${response.status} ${response.statusText} ${result.error}`);
		}
		
		return result

	} catch (error) {
		console.error(`Error fetching ${name}:`, error);
	}
}

export function getMainFrame() {
	const dashBoardComponent = document.getElementById("dashBoardComponent")
	const mainFrame = dashBoardComponent.shadowRoot.getElementById("mainFrame")
	return mainFrame
}

export function getPongPublic(){
	const dashBoardComponent = document.getElementById("dashBoardComponent")
	const pongPublic = dashBoardComponent.shadowRoot.getElementById("pongPublic")
	return pongPublic
}