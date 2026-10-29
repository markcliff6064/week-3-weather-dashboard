// using fetch, async/await, localStorage and OpenWeatherMap.
// Replace this text with your own OpenWeatherMap API key.
const API_KEY = "717e9d114fc2da1a8ab7bcbeb8a202f3";

// Get the HTML elements we need to update.
const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const unitButton = document.getElementById("unitButton");
const message = document.getElementById("message");
const weatherCard = document.getElementById("weatherCard");
const forecast = document.getElementById("forecast");
const historyContainer = document.getElementById("history");
const clearHistoryButton = document.getElementById("clearHistory");

// Store the user's preferred temperature unit.
let unit = localStorage.getItem("weatherUnit") || "C";

// This lets us switch units without fetching again.
let currentData = null;
let forecastData = null;
let currentCity = "";

// Read saved search history from localStorage.
let searchHistory = JSON.parse(
    localStorage.getItem("weatherHistory") || "[]"
);

// Show the temperature unit on the button.
function updateUnitButton() {
    unitButton.textContent =
        unit === "C" ? "Switch to °F" : "Switch to °C";
}

// Convert Celsius to Fahrenheit when needed.
function convertTemperature(celsius) {
    if (unit === "F") {
        return Math.round((celsius * 9) / 5 + 32);
    }

    return Math.round(celsius);
}

// Add the correct temperature symbol.
function showTemperature(celsius) {
    return `${convertTemperature(celsius)}°${unit}`;
}

// Display a message to the user.
function showMessage(text) {
    message.textContent = text;
}


// Show the user's previous searches as clickable buttons.
function displayHistory() {
    historyContainer.innerHTML = "";

    // Update the input's autocomplete suggestions.
    let suggestions = document.getElementById("citySuggestions");

    if (!suggestions) {
        suggestions = document.createElement("datalist");
        suggestions.id = "citySuggestions";
        cityInput.setAttribute("list", "citySuggestions");
        cityInput.insertAdjacentElement("afterend", suggestions);
    }

    suggestions.innerHTML = "";

    searchHistory.forEach(function (city) {
        // Add a city to the input's autocomplete list.
        const option = document.createElement("option");
        option.value = city;
        suggestions.appendChild(option);

        // Make a clickable history button.
        const button = document.createElement("button");
        button.textContent = city;
        button.type = "button";

        button.addEventListener("click", function () {
            cityInput.value = city;
            getWeather(city);
        });

        historyContainer.appendChild(button);
    });
}

// Save a city and keep only the latest 10 searches.
function saveHistory(city) {
    searchHistory = [
        city,
        ...searchHistory.filter(function (oldCity) {
            return oldCity.toLowerCase() !== city.toLowerCase();
        })
    ].slice(0, 10);

    localStorage.setItem(
        "weatherHistory",
        JSON.stringify(searchHistory)
    );

    displayHistory();
}


// Fetch current weather and the five-day forecast.
async function getWeather(city) {
    // Stop empty searches and prevent placeholder API keys being used.
    if (!city.trim()) {
        showMessage("Please enter a city name.");
        return;
    }

    if (API_KEY === "YOUR_API_KEY_HERE") {
        showMessage("Add your OpenWeatherMap API key in app.js.");
        return;
    }

    showMessage("Loading weather...");
    weatherCard.hidden = true;
    forecast.innerHTML = "";

    // Save the last successful data before trying a new search.
    const previousCity = currentCity;
    const previousCurrent = currentData;
    const previousForecast = forecastData;

    try {
        // The API returns temperatures in Celsius.
        const currentURL =
            `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;

        const forecastURL =
            `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;

        // Request both sets of weather data at the same time.
        const responses = await Promise.all([
            fetch(currentURL),
            fetch(forecastURL)
        ]);

        // Check both responses for errors.
        for (const response of responses) {
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error("City not found. Try another city.");
                }

                if (response.status === 401) {
                    throw new Error(
                        "Invalid API key. Check your OpenWeatherMap key."
                    );
                }

                if (response.status === 429) {
                    throw new Error(
                        "Too many requests. Please wait and try again."
                    );
                }

                throw new Error("Unable to get weather data.");
            }
        }

        // Convert the API responses into JavaScript objects.
        const currentResult = await responses[0].json();
        const forecastResult = await responses[1].json();

        // Keep the data so temperature changes do not need another request.
        currentData = currentResult;
        forecastData = forecastResult;
        currentCity = currentResult.name;

        // Save the latest successful data for offline use.
        localStorage.setItem("weatherCache", JSON.stringify({
            city: currentCity,
            current: currentData,
            forecast: forecastData,
            savedAt: Date.now()
        }));

        // Remember the city only after a successful search.
        saveHistory(currentCity);

        // Display both sections.
        displayCurrentWeather();
        displayForecast();

        showMessage("");
    } catch (error) {
        // If the network fails, try to use the last saved weather data.
        const savedWeather = localStorage.getItem("weatherCache");

        if (savedWeather && error instanceof TypeError) {
            const cached = JSON.parse(savedWeather);

            currentCity = cached.city;
            currentData = cached.current;
            forecastData = cached.forecast;

            displayCurrentWeather();
            displayForecast();

            const minutesAgo = Math.floor(
                (Date.now() - cached.savedAt) / 60000
            );

            showMessage(
                `Offline: showing saved weather for ${cached.city}. ` +
                `Last updated ${minutesAgo} minute(s) ago.`
            );
        } else {
            showMessage(error.message || "A network error occurred.");

            // Keep the last displayed data available if a search fails.
            if (previousCurrent && previousForecast) {
                currentCity = previousCity;
                currentData = previousCurrent;
                forecastData = previousForecast;
                displayCurrentWeather();
                displayForecast();
            }
        }
    }
}


// Display the current weather details.
function displayCurrentWeather() {
    // Destructuring helps us take values from the API response.
    const {
        name,
        sys: { country },
        main: { temp, feels_like, humidity, pressure },
        wind: { speed },
        weather
    } = currentData;

    const { description, icon, main: condition } = weather[0];

    document.getElementById("cityName").textContent =
        `${name}, ${country}`;

    document.getElementById("dateTime").textContent =
        new Date().toLocaleString();

    document.getElementById("temperature").textContent =
        showTemperature(temp);

    document.getElementById("feelsLike").textContent =
        `Feels like: ${showTemperature(feels_like)}`;

    document.getElementById("condition").textContent = description;
    document.getElementById("humidity").textContent = humidity;
    document.getElementById("wind").textContent = speed;
    document.getElementById("pressure").textContent = pressure;

    const weatherIcon = document.getElementById("weatherIcon");
    weatherIcon.src =
        `https://openweathermap.org/img/wn/${icon}@2x.png`;
    weatherIcon.alt = description;

    // Change the background according to the weather.
    changeBackground(condition, icon);

    weatherCard.hidden = false;
}


// Get five forecast days from the API's three-hour forecast list.
function displayForecast() {
    forecast.innerHTML = "";

    // Keep the first forecast entry for each date.
    // Prefer an entry around noon so it represents daytime weather.
    const dailyForecasts = {};

    forecastData.list.forEach(function (item) {
        const date = item.dt_txt.split(" ")[0];
        const time = item.dt_txt.split(" ")[1];

        if (!dailyForecasts[date] || time.startsWith("12:00:00")) {
            dailyForecasts[date] = item;
        }
    });

    // Use the first five available dates.
    const days = Object.values(dailyForecasts).slice(0, 5);

    days.forEach(function (day) {
        const card = document.createElement("div");
        card.className = "forecast-card";

        const dayName = new Date(day.dt_txt).toLocaleDateString(
            "en",
            { weekday: "short" }
        );

        const icon = day.weather[0].icon;
        const condition = day.weather[0].description;

        // These values are estimates from three-hour forecast entries,
        // not guaranteed daily maximum and minimum temperatures.
        const high = showTemperature(day.main.temp_max);
        const low = showTemperature(day.main.temp_min);

        card.innerHTML = `
            <h3>${dayName}</h3>
            <img
                src="https://openweathermap.org/img/wn/${icon}@2x.png"
                alt="${condition}"
            >
            <p>${high} / ${low}</p>
            <p class="forecast-condition">${condition}</p>
        `;

        forecast.appendChild(card);
    });
}


// Change the background based on the current weather.
function changeBackground(condition, icon) {
    const body = document.body;

    // OpenWeatherMap icons ending in "n" represent night.
    if (icon.endsWith("n")) {
        body.style.background =
            "linear-gradient(135deg, #191970, #483d8b)";
    } else if (condition.toLowerCase().includes("rain")) {
        body.style.background =
            "linear-gradient(135deg, #40566f, #8299ad)";
    } else if (condition.toLowerCase().includes("snow")) {
        body.style.background =
            "linear-gradient(135deg, #b8d8e8, #eef7ff)";
    } else if (condition.toLowerCase().includes("cloud")) {
        body.style.background =
            "linear-gradient(135deg, #526777, #9eafb9)";
    } else {
        body.style.background =
            "linear-gradient(135deg, #e89b30, #f6cf73)";
    }
}

// Search when the form is submitted.
searchForm.addEventListener("submit", function (event) {
    event.preventDefault();

    getWeather(cityInput.value.trim());
});

// Switch between Celsius and Fahrenheit.
unitButton.addEventListener("click", function () {
    unit = unit === "C" ? "F" : "C";

    // Remember the selected unit.
    localStorage.setItem("weatherUnit", unit);

    updateUnitButton();

    // Re-display the saved data without another API request.
    if (currentData && forecastData) {
        displayCurrentWeather();
        displayForecast();
    }
});

// Clear the saved search history.
clearHistoryButton.addEventListener("click", function () {
    searchHistory = [];

    localStorage.removeItem("weatherHistory");

    displayHistory();
});

// Set up the page when it first opens.
updateUnitButton();
displayHistory();

// Load Nairobi as the first example city.
getWeather("Nairobi");