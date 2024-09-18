const { By } = require('selenium-webdriver');
const { login, logout, sleep } = require('./utils');
const configs = require ('./configs');
const assert = require("assert");

testFriendProfile = async (driver, next=null) => {
	await login(driver, configs.users[0])

	const dashBoardComponent = await driver.findElement(By.id("dashBoardComponent"))
	const dashBoardShadowRoot = await driver
		.executeScript('return arguments[0].shadowRoot', dashBoardComponent)
	const friendsComponent = dashBoardShadowRoot.findElement(By.id("friendsComponent"))
	const friendsShadowRoot = await driver
		.executeScript('return arguments[0].shadowRoot', friendsComponent)
	const friendTableBody = await friendsShadowRoot.findElement(By.id("friendTableBody"))
	const trElement = await friendTableBody.findElements(By.css("tr"))
	for (const el of trElement){
		const friendName = await el.getAttribute("id")
		const friendProfileBtn = await el.findElement(By.id(`${friendName}ProfileBtn`))
		await friendProfileBtn.click()

		await sleep(configs.timeWait)
		const friendProfileComponent = await dashBoardShadowRoot
			.findElement(By.id("friendProfileComponent"))
		const friendProfileShadowRoot = await driver
			.executeScript('return arguments[0].shadowRoot', friendProfileComponent)
		const usernameEl = await friendProfileShadowRoot.findElement(By.id("username"))
		const username = await usernameEl.getText()

		await sleep(configs.timeWait)
		assert.equal (friendName, username, "friend profile should show in mainframe")
	}
	
	await logout(driver)
}

module.exports = testFriendProfile