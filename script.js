const apiKey = "c61f4d5b368563370f04a1258151f6c0";
const wInfo = document.getElementById("weather-info");
const locNote = document.getElementById("location-note");
const ctx = document.getElementById("forecast-chart").getContext("2d");
let map, marker;

// Initialize map
function initMap(lat, lon, city) {
  if (!map) {
    map = L.map("map").setView([lat, lon], 8);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);
  } else map.setView([lat, lon], 8);

  if (marker) marker.setLatLng([lat, lon]);
  else marker = L.marker([lat, lon]).addTo(map).bindPopup(city).openPopup();
}

// Fetch current weather + 5-day forecast
async function fetchWeather(lat, lon, citySearch = null) {
  const base = "https://api.openweathermap.org/data/2.5/";
  const currURL = citySearch
    ? `${base}weather?q=${citySearch}&appid=${apiKey}&units=metric`
    : `${base}weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
  const fURL = citySearch
    ? `${base}forecast?q=${citySearch}&appid=${apiKey}&units=metric`
    : `${base}forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

  try {
    const [curr, fut] = await Promise.all([fetch(currURL), fetch(fURL)]);
    if (!curr.ok || !fut.ok) {
      throw new Error("City not found or forecast unavailable");
    }
    const currData = await curr.json();
    const futData = await fut.json();
    updateUI(currData);
    drawForecast(futData);
    initMap(currData.coord.lat, currData.coord.lon, currData.name);
  } catch (e) {
    alert(e.message);
  }
}

function updateUI(data) {
  const d = new Date();
  wInfo.innerHTML = `
    <h2>${data.name}, ${d.toLocaleDateString()}</h2>
    <img src="http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png">
    <p>🌡️ ${Math.round(data.main.temp)}°C</p>
    <p>🌤️ ${data.weather[0].description}</p>
    <p>💨 Wind ${data.wind.speed} m/s</p>`;
}

function drawForecast(fore) {
  const daily = {};
  fore.list.forEach((item) => {
    const day = item.dt_txt.slice(0, 10);
    if (!daily[day]) daily[day] = [];
    daily[day].push(item.main.temp);
  });
  const labels = Object.keys(daily).slice(0, 5);
  const temps = labels.map((d) => {
    const t = daily[d];
    return {
      max: Math.max(...t),
      min: Math.min(...t),
      avg: t.reduce((a, b) => a + b) / t.length,
    };
  });

  new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Max Temp",
          data: temps.map((x) => x.max),
          borderColor: "#e74c3c",
        },
        {
          label: "Min Temp",
          data: temps.map((x) => x.min),
          borderColor: "#3498db",
        },
      ],
    },
    options: { responsive: true },
  });
}

// Search button
document.getElementById("search-btn").onclick = () => {
  const city = document.getElementById("city-input").value.trim();
  if (city) fetchWeather(null, null, city);
};

// On load—auto-locate
window.onload = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        locNote.textContent = "";
        fetchWeather(pos.coords.latitude, pos.coords.longitude);
      },
      () => (locNote.textContent = "(Location access denied)")
    );
  } else locNote.textContent = "(Geolocation unsupported)";
};
