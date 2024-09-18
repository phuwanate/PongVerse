import { DashBoardPage } from "./components/DashBoardPage.js"
import { Profile } from "./components/Profile.js"
import { Notification } from "./components/Notification.js"
import { AccountManagment } from "./components/AccountManagment.js"
import { Statistic, StatisticBase } from "./components/Statistic.js"
import { MatchHistory, MatchHistoryBase } from "./components/MatchHistory.js"
import { BlockedList } from "./components/BlockedList.js"
import { RecommendFriends } from "./components/RecommendFriends.js"
import { FriendProfile } from "./components/FriendProfile.js"

customElements.define("dashboard-component", DashBoardPage)
customElements.define("profile-component", Profile)
customElements.define("notification-component", Notification)
customElements.define("account-management-component", AccountManagment)
customElements.define("statistic-component", Statistic)
customElements.define("statistic-base-component", StatisticBase)
customElements.define("match-history-component", MatchHistory)
customElements.define("match-history-base-component", MatchHistoryBase)
customElements.define("blocked-list-component", BlockedList)
customElements.define("recommend-friend-component", RecommendFriends)
customElements.define("friend-profile-component", FriendProfile)