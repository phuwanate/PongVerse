const configs = require("./configs")
const { login, logout, profileNavigate, friendRecommendNavigate } = require("./utils")

testMainFrame = async (driver) => {
	await login(driver, configs.users[0])

	await profileNavigate(driver, "accountManagementLink", "Baby cadet acount management", "accountManagementComponent")
	await profileNavigate(driver, "notificationLink", "Baby cadet notification", "notificationComponent")
	await profileNavigate(driver, "statisticLink", "Baby cadet statistic", "statisticComponent")
	await profileNavigate(driver, "matchHistoryLink", "Baby cadet match history", "matchHistoryComponent")
	await profileNavigate(driver, "blockedListLink", "Baby cadet blocked list", "blockedListComponent")

	await friendRecommendNavigate(driver)

	await logout(driver)
}

module.exports = testMainFrame
