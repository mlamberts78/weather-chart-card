<h1 align="center">Weather Chart Card</h1>

[![Buy me a coffee](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/mlamberts7I)

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/mlamberts78/weather-chart-card?style=flat-square)](https://github.com/mlamberts78/weather-chart-card/releases/latest)
![GitHub downloads](https://img.shields.io/github/downloads/mlamberts78/weather-chart-card/total?style=flat-square)
![GitHub release (latest by SemVer including pre-releases)](https://img.shields.io/github/downloads/mlamberts78/weather-chart-card/latest/total)
[![HACS Validate](https://github.com/mlamberts78/weather-chart-card/actions/workflows/validate.yaml/badge.svg)](https://github.com/mlamberts78/weather-chart-card/actions/workflows/validate.yaml)
![maintained](https://img.shields.io/maintenance/yes/2023.svg)

![weather-chart-card](https://github.com/mlamberts78/weather-chart-card/assets/93537082/bd5b9f6e-4125-4a19-9773-463e6d054bce)
![15days-forecast](https://github.com/mlamberts78/weather-chart-card/assets/93537082/3135a96c-40d6-4212-b6a7-5f6b535faf47)

## Installation

### HACS Custom

1. Go to any of the sections (integrations, frontend).
2. Click on the 3 dots in the top right corner.
3. Select "Custom repositories"
4. Add the URL to the repository: https://github.com/mlamberts78/weather-chart-card
5. Select the category "Lovelace".
6. Click the "ADD" button.

#### Configuration variables:

##### Card options

| Name                  | Type    | Default                  | Description                                                                                        |
| ----------------------| ------- | -------------------------|--------------------------------------------------------------------------------------------------- |
| type                  | string  | **Required**             | Should be `custom:weather-chart-card`.                                                             |
| entity                | string  | **Required**             | An entity_id with the `weather` domain.                                                            |
| temp                  | string  | none                     | An entity_id for a custom temperature sensor.                                                      |
| press                 | string  | none                     | An entity_id for a custom pressure sensor.                                                         |
| humid                 | string  | none                     | An entity_id for a custom humidity sensor.                                                         |
| uv                    | string  | none                     | An entity_id for a custom UV index sensor.                                                         |
| winddir               | string  | none                     | An entity_id for a custom wind bearing sensor.                                                     |
| windspeed             | string  | none                     | An entity_id for a custom wind speed sensor.                                                       |
| title                 | string  | none                     | Card title.                                                                                        |
| show_main             | boolean | true                     | Show or hide a section with current weather condition and temperature.                             |
| show_current_condition| boolean | true                     | Show or hide the current weather condition.                                                        |
| show_attributes       | boolean | true                     | Show or hide a section with attributes such as pressure, humidity, wind direction and speed, etc.  |
| show_time             | boolean | false                    | Show or hide the current time on the card.                                                         |
| show_day              | boolean | false                    | Show or hide the current day on the card. (Only visible when show_time is true.)                   |
| show_date             | boolean | false                    | Show or hide the current date the card. (Only visible when show_time is true.)                     |
| show_humid            | boolean | true                     | Show or hide humidity on the card.                                                                 |
| show_pressure         | boolean | true                     | Show or hide pressure on the card.                                                                 |
| show_wind_direction   | boolean | true                     | Show or hide wind_direction on the card.                                                           |
| show_wind_speed       | boolean | true                     | Show or hide wind_speed on the card.                                                               |
| icons                 | string  | none                     | Path to the location of custom icons in svg format, for example `/local/weather-icons/`.           |
| animated_icons        | boolean | false                    | Enable the use of animated icons                                                                   |
| icons_size            | number  | 25                       | The size of the animated or custom icons in pixels.                                                |
| current_temp_size     | number  | 28                       | The size of the current temperature in pixels.                                                     |
| forecast              | object  | none                     | See [forecast options](#forecast-options) for available options.                                   |
| units                 | object  | none                     | See [units of measurement](#units-of-measurement) for available options.                           |

##### Forecast options

| Name                 | Type    | Default                  | Description                                                                                        |
| -------------------- | ------- | -------------------------|--------------------------------------------------------------------------------------------------- |
| precipitation_type   | string  | rainfall                 | Show precipitation in 'rainfall' or 'probability'.                                                 |
| labels_font_size     | string  | 11                       | Font size for temperature and precipitation labels.                                                |
| precip_bar_size      | string  | 100                      | Adjusts the thickness of precipitation bars (1-100).                                               |
| temperature1_color   | string  | rgba(255, 152, 0, 1.0)   | Temperature first line chart color.                                                                |
| temperature2_color   | string  | rgba(68, 115, 158, 1.0)  | Temperature second line chart color.                                                               |
| precipitation_color  | string  | rgba(132, 209, 253, 1.0) | Precipitation bar chart color.                                                                     |
| chart_datetime_color | string  | primary-text-color       | Chart day or hour color                                                                            |
| chart_text_color     | string  | none                     | Chart text color                                                                                   |
| condition_icons      | boolean | true                     | Show or hide forecast condition icons.                                                             |
| show_wind_forecast   | boolean | true                     | Show or hide wind forecast on the card.                                                            |
| round_temp           | boolean | false                    | Option for rounding the forecast temperatures                                                      |
| style                | string  | style1                   | Change chart style, options: 'style1' or 'style2'                                                  |
| type                 | string  | daily                    | Show daily or hourly forecast if available, options: 'daily' or 'hourly'                           |
| use_12hour_format    | boolean | false                    | Display time in 12-hour format (AM/PM) instead of 24-hour format.                                  |

##### Units of measurement

| Name                 | Type    | Default                  | Description                                                                                        |
| -------------------- | ------- | -------------------------|--------------------------------------------------------------------------------------------------- |
| pressure             | string  | none                     | Convert to 'hPa' or 'mmHg' or 'inHg'                                                               |
| speed                | string  | none                     | Convert to 'km/h' or 'm/s' or 'Bft' or 'mph'                                                       |

###### What custom icons can I use?
Icons should be in svg format. Icons should have names as shown [here](https://github.com/mlamberts78/weather-chart-card/blob/master/src/const.js#L24). Example:
![130360372-76d70c42-986c-46e3-b9b5-810f0317f94f](https://github.com/mlamberts78/weather-chart-card/assets/93537082/d3ee55a2-e64f-4354-b36d-9faf6ea37361)

#### Example usage:
###### Card with current time, date and day
![Time](https://github.com/mlamberts78/weather-chart-card/assets/93537082/fa823cf1-aec7-41d7-9216-098fd6f8e388)
```yaml
type: custom:weather-chart-card
entity: weather.my_home
show_time: true
show_date: true
show_date: true
units:
  speed: Bft
```
###### Style2 chart
![style2](https://github.com/mlamberts78/weather-chart-card/assets/93537082/3067cc43-0e80-492c-b4a5-771b1e44ea17)
```yaml
type: custom:weather-chart-card
entity: weather.my_home
forecast:
  style: style2
```
###### Chart only
![Chart-only](https://github.com/mlamberts78/weather-chart-card/assets/93537082/c99d85a4-30d1-4fd9-90ff-877421b39e9b)
```yaml
type: custom:weather-chart-card
entity: weather.my_home
show_main: false
show_attributes: false
forecast:
  condition_icons: false
  show_wind_forecast: false
```

###### Custom units
![Units](https://github.com/mlamberts78/weather-chart-card/assets/93537082/e72862ee-9bb7-4f97-9a3c-b17663c458aa)
```yaml
type: custom:weather-chart-card
entity: weather.my_home
units:
  pressure: mmHg
  speed: m/s
```

###### Supported languages:
Bulgarian <br />
Czech <br />
Danish <br />
Dutch <br />
English <br />
Finnish <br />
French <br />
German <br />
Greek <br />
Hungarian <br />
Italian <br />
Norwegian <br />
Polish <br />
Portuguese <br />
Russian <br />
Spanish <br />
Swedish
