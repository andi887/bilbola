async function loadTeams() {
  const response = await fetch("../data/teams.json");
  const teams = await response.json();

  const container = document.getElementById("teamsContainer");
  container.innerHTML = "";

  teams.forEach(team => {
    const li = document.createElement("li");
    li.textContent = team;
    container.appendChild(li);
  });
}

loadTeams();
