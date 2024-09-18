const { By } = require('selenium-webdriver');
const {login, logout, sleep, elementDisappear} = require("./utils")
const configs = require("./configs")
const { profileNavigate } = require("./utils")

friendDecline = async (driver, user, declineUser) => {
	await login(driver, user)

	const notificationEL = await profileNavigate(driver, 
		"notificationLink", "Baby cadet notification", "notificationComponent")
	const notificationShadowRoot = await driver
		.executeScript('return arguments[0].shadowRoot', notificationEL)
	const declineBtn = await notificationShadowRoot
		.findElement(By.id(`${declineUser.username}FriendDecline`))
	await declineBtn.click()
	await sleep(configs.timeWait)
	await elementDisappear(notificationShadowRoot, `${declineUser.username}FriendDecline`)

	await logout(driver)
}

testFriendDecline = async (driver) => {
	for (let i = 1; i < configs.users.length; i++) {
		await friendDecline(driver, configs.users[i], configs.users[0])
	}

	for (let i = 2; i < configs.users.length; i++) {
		await friendDecline(driver, configs.users[i], configs.users[1])
	}
}

module.exports = testFriendDecline