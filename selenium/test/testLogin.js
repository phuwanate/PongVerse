const configs = require("./configs")
const {login, logout} = require("./utils")

testLogin = async (driver) => {
	for (const user of configs.users) {
		await login(driver, user)
		await logout(driver)
	}
}

module.exports = testLogin