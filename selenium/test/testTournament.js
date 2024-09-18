const { Builder, By } = require('selenium-webdriver');
const configs = require('./configs');
const { login, logout, findShadowRoot, sleep } = require('./utils');
const assert = require("assert");

async function findTourBoardcast(driver){
	const dashBoard = await driver.findElement(By.id('dashBoardComponent'))
	const dashBoardShadowRoot = await driver.executeScript('return arguments[0].shadowRoot', dashBoard)
	const pongPublic = await dashBoardShadowRoot.findElement(By.id('pongPublic'))
	const pongPublicShadowRoot = await driver.executeScript('return arguments[0].shadowRoot', pongPublic)
	const tourBoardcast = await pongPublicShadowRoot.findElement(By.id('tourBoardcast'))
	const shadowRoot = await driver.executeScript('return arguments[0].shadowRoot', tourBoardcast)
	return shadowRoot
}

async function findPongTourMatch(driver){
	const dashBoard = await driver.findElement(By.id('dashBoardComponent'))
	const dashBoardShadowRoot = await driver.executeScript('return arguments[0].shadowRoot', dashBoard)
	const pongTourMatch = await dashBoardShadowRoot.findElement(By.id('pongTourMatch'))
	const shadowRoot = await driver.executeScript('return arguments[0].shadowRoot', pongTourMatch)
	return shadowRoot
}

async function checkPongTourMatch(driver, index) {
	const pongTourMatch = await findPongTourMatch(driver)
	const waitRoom = await pongTourMatch.findElement(By.id('waitRoom'))
	const players = await waitRoom.findElements(By.css('pong-player-component'))
	assert.equal(players.length, index + 1, `player in wait room should be ${index + 1}`)
	for (let i = 0; i <= index; i++){
		let playerName = await players[i].getAttribute("id")
		assert.equal(playerName, configs.users[i].username, `player name should be ${configs.users[i].username}`)
	}
}

async function checkAmountPlayer(driver, amount){
	tourBoardcast = await findTourBoardcast(driver)
	await sleep(configs.timeWait * 5)
	const amountPlayer = await tourBoardcast.findElement(By.id("amountPlayer"))
	const value = await amountPlayer.getText()
	assert.equal(parseInt(value), amount, `register should be ${amount}`)
}

async function joinTour(driver, user){
	const tourBoardcast = await findTourBoardcast(driver)
	const joinBtn = await tourBoardcast.findElement(By.css("button"))
	await joinBtn.click()

	// Switch to the alert (JavaScript prompt)
	let alert = await driver.switchTo().alert()

	// Input the nickname into the prompt
	await alert.sendKeys(`${user.username}_nick`)

	// Accept the prompt (click OK)
	await alert.accept()
}

async function readyTour(driver){
	const pongTourMatch = await findPongTourMatch(driver)
	const waitRoom = await pongTourMatch.findElement(By.id('waitRoom'))
	const players = await waitRoom.findElements(By.css("pong-player-component"))
	for (const player of players) {
		const playerShadowRoot = await driver.executeScript('return arguments[0].shadowRoot', player)
		const btn = await playerShadowRoot.findElement(By.css("button"))
		const btnEnable = await btn.isEnabled()
		if (btnEnable) {
			await driver.executeScript("arguments[0].click();", btn);
			break
		}
	}
}

testTournament = async () => {
	const maxPlayer = 4
	const drivers = []

	/** open browser */
	for (let i = 0; i < maxPlayer; i++) {
		const driver = await new Builder().forBrowser('chrome').build();
		await driver.get(configs.url);
		drivers.push(driver)
	}

	/** login user */
	for (let i = 0; i < maxPlayer; i++) {
		await drivers[i].switchTo().window(await drivers[i].getWindowHandle()); 
		await login(drivers[i], configs.users[i])
	}

	/** join tournament */
	for (let i = 0; i < maxPlayer; i++) {
		await drivers[i].switchTo().window(await drivers[i].getWindowHandle()); 
		await joinTour(drivers[i], configs.users[i], i)
		/** check number of player */
		for (let j = 0; j <= i; j++) {
			await drivers[j].switchTo().window(await drivers[j].getWindowHandle()); 
			await checkAmountPlayer(drivers[j], i + 1)
			await checkPongTourMatch(drivers[i], i)
		}
	}

	/** ready tournament */
	for (let i = 0; i < maxPlayer; i++) {
		await drivers[i].switchTo().window(await drivers[i].getWindowHandle()); 
		await readyTour(drivers[i])
	}

	/** logout user */
	for (let i = 0; i < maxPlayer; i++) {
		await drivers[i].switchTo().window(await drivers[i].getWindowHandle()); 
		await logout(drivers[i], configs.users[i])
	}

	/** quit driver */
	for (let i = 0; i < maxPlayer; i++){
		await drivers[i].quit()
	}
}

module.exports = testTournament