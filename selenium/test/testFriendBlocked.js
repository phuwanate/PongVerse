const { By } = require('selenium-webdriver');
const { sleep, elementDisappear, login, logout, profileNavigate, findShadowRoot } = require("./utils")
const configs = require("./configs") 
const assert = require("assert");

// findShadowRoot = async (driver, parent, componentId) => {
// 	const component = await parent.findElement(By.id(componentId))
// 	return await driver.executeScript('return arguments[0].shadowRoot', component)
// }

testFriendBlocked = async (driver) => {
	await login(driver, configs.users[0])
	const dashBoardShadowRoot = await findShadowRoot(driver, driver, "dashBoardComponent")
	const friendsShadowRoot = await findShadowRoot(driver, dashBoardShadowRoot, "friendsComponent")
	const friendComponents = await friendsShadowRoot.findElements(By.css("friend-component"))
	const friendCount = friendComponents.length
	// console.log("friendCount: ", friendCount)

	// block
	for (let i = 0; i < friendCount; i++) {
		const friendComponent = await friendsShadowRoot.findElement(By.css("friend-component"))
		const friendName = await friendComponent.getAttribute("data-username")
		const friendShadowRoot = await driver.executeScript('return arguments[0].shadowRoot', friendComponent)

		const friendProfileBtn = await friendShadowRoot.findElement(By.id('profileBtn'))
		await friendProfileBtn.click()

		await sleep(configs.timeWait)
		const friendProfileShadowRoot = await findShadowRoot(driver, dashBoardShadowRoot, "friendProfileComponent")
		const usernameEl = await friendProfileShadowRoot.findElement(By.id("username"))
		const username = await usernameEl.getText()
		assert.equal (friendName, username, "friend profile should show in mainframe")

		const blockBtn = await friendProfileShadowRoot.findElement(By.id("blockBtn"))
		await blockBtn.click()
		await sleep(configs.timeWait)
		await elementDisappear(friendsShadowRoot, `${friendName}`)
		await dashBoardShadowRoot.findElement(By.id("blockedListComponent"))
	}

	// unblock
	for (let i = 0; i < friendCount; i++) {
		const blockedListComponent = await profileNavigate(driver, "blockedListLink", 
			"Baby cadet blocked list", "blockedListComponent")
		const blockedListShadowRoot = await driver
		.executeScript('return arguments[0].shadowRoot', blockedListComponent)

		await sleep(configs.timeWait)
		const trEl = await blockedListShadowRoot.findElement(By.css("tr"))
		const friendName = await trEl.getAttribute("id")
		const unBlockBtn = await trEl.findElement(By.id(`${friendName}UnBlockBtn`))
		await unBlockBtn.click()
		await sleep(configs.timeWait)
		await elementDisappear(blockedListShadowRoot, `${friendName}UnBlockBtn`)
		await friendsShadowRoot.findElement(By.id(friendName))
	}

	await logout(driver)
}

module.exports = testFriendBlocked