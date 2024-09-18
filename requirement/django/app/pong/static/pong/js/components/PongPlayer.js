export class PongPlayer extends HTMLElement{
	constructor() {
		super()
		this.attachShadow({mode: 'open'})
		this.shadowRoot.innerHTML = this.template()
	}

	template = () => {
		return `
			<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
			<link rel="stylesheet" href="${window.location.origin}/static/pong/js/components/PongPlayer.css">
			

			<div class="player d-flex align-items-center justify-content-between" data-index="${this.dataset.index}">
				<div class="d-flex align-items-center ms-0 ms-sm-3">
					<img class="player-avatar rounded" id="friendImg" src="${this.dataset.avatar}" alt="profile friend"
					onerror="this.onerror=null; this.src='/user-media/avatars/default.png';"/>
					<p id="profileName" class="player-name my-0 ms-2 ms-sm-3">${this.dataset.name}</p>
				</div>
				<div>
					<button data-name="${this.dataset.name}" data-index="${this.dataset.index}" 
						class="player-status d-flex align-items-center justify-content-center gap-2 border-0 ${this.dataset.status}" disabled>${this.dataset.status}
					</button>
				</div>
			</div>
		`
	}
}