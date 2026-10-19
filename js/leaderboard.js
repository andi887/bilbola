import { listenLeaderboard } from "./firestore-service.js";

const tbody = document.querySelector("#leaderboardTable tbody");

listenLeaderboard((data) => {
  tbody.innerHTML = "";
  data.forEach((user, index) => {
    const row = `<tr>
      <td>${index + 1}</td>
      <td>${user.username}</td>
      <td>${user.points}</td>
      <td>${(user.accuracy * 100).toFixed(2)}%</td>
    </tr>`;
    tbody.innerHTML += row;
  });
});
