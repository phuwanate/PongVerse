import {fetchJson, getUserId} from "./Utils.js"
export class MatchHistoryBase extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.shadowRoot.innerHTML = this.template();
	}

	template = () => {
		return `
			<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
			<link rel="stylesheet" href="${window.location.origin}/static/frontend/js/components/MatchHistory.css">
			
			<table>
				<thead>
					<tr>
						<th>Type</th> 
						<th>Date</th>
						<th>Opponent player</th>
						<th>Outcome</th>
					</tr>
				</thead>
				<tbody id="matchHistoryTableBody">
				</tbody>
			</table>
		`;
	};

	async fetchMatchHistory() {
		const playerID = typeof this.dataset.player_id === 'undefined' ? getUserId() : this.dataset.player_id
		const result = await fetchJson('fatchMatchHistory', 'GET', 
			`${window.location.origin}/pong/players/${playerID}/match_history`)
		if (result) {
			// console.log(result)
			const tbody = this.shadowRoot.querySelector('table tbody');
			// const options = { day: 'numeric', month: 'short', year: 'numeric' }
			result.forEach(mock => {
				const date = new Date(mock.date)
				const tr = document.createElement('tr');
				const trContent = `
					<td>${mock.matchType}</td>
					<td>${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
					<td>${mock.opponentPlayer}</td>
					<td>${mock.outcome}</td>
				`;
				tr.innerHTML = trContent;
				tbody.appendChild(tr);
			});
		}
	}

	connectedCallback() {
		this.fetchMatchHistory()
	}

	disconnectedCallback() {
	}
}

export class MatchHistory extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.shadowRoot.innerHTML = this.template();
	}

	template = () => {
		return `
			<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
			<link rel="stylesheet" href="${window.location.origin}/static/frontend/js/components/MatchHistory.css">
			
			<div class="bg-white overflow-auto custom-bg">
				<div id="header" class="fw-bold">
					<p>Match History</p>
				</div>
				<match-history-base-component data-player_id=${getUserId()}></match-history-base-component>	
			</div>
		`
	}
}
