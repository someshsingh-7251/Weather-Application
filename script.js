const apiKey = "c61f4d5b368563370f04a1258151f6c0";
const wInfo = document.getElementById("weather-info");
const locNote = document.getElementById("location-note");
const ctx = document.getElementById("forecast-chart").getContext("2d");
let map, marker;

function initMap(lat, lon, city) {
  if (!map) {
    map = L.map("map").setView([lat, lon], 8);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(
      map
    );
  } else map.setView([lat, lon], 8);

  if (marker) marker.setLatLng([lat, lon]);
  else marker = L.marker([lat, lon]).addTo(map).bindPopup(city).openPopup();
}

async function fetchWeather(lat, lon, city = null) {
  const base = "https://api.openweathermap.org/data/2.5/";
  const currentURL = city
    ? `${base}weather?q=${city}&appid=${apiKey}&units=metric`
    : `${base}weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
  const forecastURL = city
    ? `${base}forecast?q=${city}&appid=${apiKey}&units=metric`
    : `${base}forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

  try {
    const [currRes, forecastRes] = await Promise.all([
      fetch(currentURL),
      fetch(forecastURL),
    ]);
    const currData = await currRes.json();
    const forecastData = await forecastRes.json();

    updateUI(currData);
    drawForecast(forecastData);
    initMap(currData.coord.lat, currData.coord.lon, currData.name);
    updateBackground(currData.weather[0].description);
  } catch (e) {
    alert("City not found or API error");
  }
}

function updateUI(data) {
  const d = new Date();
  wInfo.innerHTML = `
    <h2>${data.name}, ${d.toLocaleDateString()}</h2>
    <img src="http://openweathermap.org/img/wn/${
      data.weather[0].icon
    }@2x.png" />
    <p>🌡️ ${Math.round(data.main.temp)}°C</p>
    <p>🌤️ ${data.weather[0].description}</p>
    <p>💨 Wind: ${data.wind.speed} m/s</p>`;
}

function drawForecast(data) {
  const daily = {};
  data.list.forEach((item) => {
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
    };
  });

  new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Max Temp",
          data: temps.map((t) => t.max),
          borderColor: "#e74c3c",
        },
        {
          label: "Min Temp",
          data: temps.map((t) => t.min),
          borderColor: "#3498db",
        },
      ],
    },
  });
}

function updateBackground(desc) {
  const bg = desc.toLowerCase();
  if (bg.includes("cloud")) {
    document.body.style.background =
      "linear-gradient(to top, #bdc3c7, #2c3e50)";
  } else if (bg.includes("rain")) {
    document.body.style.background =
      "linear-gradient(to top, #4e54c8, #8f94fb)";
  } else if (bg.includes("clear")) {
    document.body.style.background =
      "linear-gradient(to top, #56ccf2, #2f80ed)";
  } else if (bg.includes("snow")) {
    document.body.style.background =
      "linear-gradient(to top, #e0eafc, #cfdef3)";
  } else {
    document.body.style.background =
      "linear-gradient(135deg, #2980b9, #6dd5fa)";
  }
}

document.getElementById("search-btn").onclick = () => {
  const city = document.getElementById("city-input").value.trim();
  if (city) fetchWeather(null, null, city);
};

window.onload = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        locNote.textContent = "";
        fetchWeather(pos.coords.latitude, pos.coords.longitude);
      },
      () => (locNote.textContent = "(Could not detect location)")
    );
  } else {
    locNote.textContent = "(Geolocation not supported)";
  }
};
