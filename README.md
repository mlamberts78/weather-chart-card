<h1 align="center">Weather Chart Card</h1>
<p align="center">
  <a href="https://github.com/custom-components/hacs">
    <img src="https://img.shields.io/badge/HACS-Default-orange.svg" />
  </a>
</p>

![image](https://user-images.githubusercontent.com/33804747/155938742-67770857-33b2-4e95-9601-737677895115.png)

## Installation

### HACS (recommended)

This card is available in [HACS](https://hacs.xyz/) (Home Assistant Community Store).
<small>_HACS is a third party community store and is not included in Home Assistant out of the box._</small>

### Manual install

1. Download and copy `weather-chart-card.js` from the [latest release](https://github.com/mlamberts78/weather-chart-card/releases/latest) into your `config/www` directory.

2. Add the resource reference as decribed below.

### CLI install

1. Move into your `config/www` directory.

2. Grab `weather-chart-card.js`:

```
$ wget https://github.com/mlamberts78/weather-chart-card/releases/download/V1.1/weather-chart-card.js
```

3. Add the resource reference as decribed below.

Add a reference to the copied file inside your `configuration.yaml` or in the Home Assistant UI:

[![Open your Home Assistant instance and show your Lovelace resources.](https://my.home-assistant.io/badges/lovelace_resources.svg)](https://my.home-assistant.io/redirect/lovelace_resources/)
```yaml
# Example Lovelace UI config entry
resources:
- type: module
  url: /local/weather-chart-card.js
```
Then you can add the card to the view:
```yaml
# Example Lovelace UI config entry
type: custom:weather-chart-card
entity: weather.home
```

#### Configuration variables:

##### Card options

| Name                 | Type    | Default                  | Description                                                                                        |
| -------------------- | ------- | -------------------------|--------------------------------------------------------------------------------------------------- |
| type                 | string  | **Required**             | Should be `custom:weather-chart-card`.                                                             |
| entity               | string  | **Required**             | An entity_id with the `weather` domain.                                                            |
| title                | string  | none                     | Card title.                                                                                        |
| show_main            | boolean | true                     | Show or hide a section with current weather condition and temperature.                             |
| show_attributes      | boolean | true                     | Show or hide a section with attributes such as pressure, humidity, wind direction and speed, etc.  |
| icons                | string  | none                     | Path to the location of custom icons in svg format, for example `/local/weather-icons/`.           |
| icons_size           | number  | 25                       | The size of custom icons in pixels.                                                                |
| forecast             | object  | none                     | See [forecast options](#forecast-options) for available options.                       |
| units                | object  | none                     | See [units of measurement](#units-of-measurement) for available options.                           |

##### Forecast options

| Name                 | Type    | Default                  | Description                                                                                        |
| -------------------- | ------- | -------------------------|--------------------------------------------------------------------------------------------------- |
| labels_font_size     | string  | 11                       | Font size for temperature and precipitation labels.                                                |
| temperature1_color   | string  | rgba(255, 152, 0, 1.0)   | Temperature first line chart color.                                                                |
| temperature2_color   | string  | rgba(68, 115, 158, 1.0)  | Temperature second line chart color.                                                               |
| precipitation_color  | string  | rgba(132, 209, 253, 1.0) | Precipitation bar chart color.                                                                     |
| condition_icons      | boolean | true                     | Show or hide forecast condition icons.                                                             |

##### Units of measurement

| Name                 | Type    | Default                  | Description                                                                                        |
| -------------------- | ------- | -------------------------|--------------------------------------------------------------------------------------------------- |
| pressure             | string  | 'hPa'                    | Can be 'hPa' or 'mmHg'                                                                             |
| speed                | string  | 'km/h'                   | Can be 'km/h' or 'm/s'                                                                             |

###### What custom icons can I use?
Icons should be in svg format. Icons should have names as shown [here](https://github.com/Yevgenium/weather-chart-card/blob/a9f795f2fd02028bdad9b771d383fa38c5f3148c/src/const.js#L24). Example:
![image](https://user-images.githubusercontent.com/33804747/130360372-76d70c42-986c-46e3-b9b5-810f0317f94f.png)


#### Example usage:
###### Basic
![130359790-e2a7bceb-29d5-494e-9f6e-d679a3e41222](https://user-images.githubusercontent.com/33804747/139556131-a7547ed3-1e7a-4761-9486-4fba4f070736.png)
```yaml
type: custom:weather-chart-card
entity: weather.home_hourly
```
###### Chart only
![image](https://user-images.githubusercontent.com/33804747/130359944-2f68a668-07ab-4a0a-bd9e-43ea9bf738a3.png)
```yaml
type: custom:weather-chart-card
entity: weather.openweathermap
show_main: false
show_attributes: false
icons: /local/weather-icons/
```

###### Custom units
![image](https://user-images.githubusercontent.com/33804747/139555950-221c5d69-1106-4db8-b0a4-0db020d0b56a.png)
```yaml
type: custom:weather-chart-card
entity: weather.home_hourly
show_attributes: true
units:
  pressure: mmHg
  speed: km/h
```

###### Supported languages:
Czech <br />
German <br />
Dutch <br />
English <br />
Spanish <br />
Finnish <br />
Hungarian <br />
Russian <br />
Swedish <br />
French
