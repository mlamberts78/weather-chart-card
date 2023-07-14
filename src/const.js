const cardinalDirectionsIcon = [
  'arrow-down', 'arrow-bottom-left', 'arrow-left',
  'arrow-top-left', 'arrow-up', 'arrow-top-right',
  'arrow-right', 'arrow-bottom-right', 'arrow-down'
];

const weatherIcons = {
  'clear-night': 'hass:weather-night',
  'cloudy': 'hass:weather-cloudy',
  'exceptional': 'mdi:alert-circle-outline',
  'fog': 'hass:weather-fog',
  'hail': 'hass:weather-hail',
  'lightning': 'hass:weather-lightning',
  'lightning-rainy': 'hass:weather-lightning-rainy',
  'partlycloudy': 'hass:weather-partly-cloudy',
  'pouring': 'hass:weather-pouring',
  'rainy': 'hass:weather-rainy',
  'snowy': 'hass:weather-snowy',
  'snowy-rainy': 'hass:weather-snowy-rainy',
  'sunny': 'hass:weather-sunny',
  'windy': 'hass:weather-windy',
  'windy-variant': 'hass:weather-windy-variant'
};

const weatherIconsDay = {
  'clear-night': 'night',
  'cloudy': 'cloudy',
  'exceptional': '!!',
  'fog': 'cloudy',
  'hail': 'rainy-7',
  'lightning': 'thunder',
  'lightning-rainy': 'thunder',
  'partlycloudy': 'cloudy-day-3',
  'pouring': 'rainy-6',
  'rainy': 'rainy-5',
  'snowy': 'snowy-6',
  'snowy-rainy': 'rainy-7',
  'sunny': 'day',
  'windy': 'cloudy',
  'windy-variant': 'cloudy-day-3',
};

const weatherIconsNight = {
  ...weatherIconsDay,
  'sunny': 'night',
  'partlycloudy': 'cloudy-night-2',
};

export {
  cardinalDirectionsIcon,
  weatherIcons,
  weatherIconsDay,
  weatherIconsNight
};
