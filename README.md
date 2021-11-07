![image](https://user-images.githubusercontent.com/33804747/139556051-d60c824d-0480-4812-a4c0-4f612ab4015b.png)

## Configuration

Download and copy `weather-chart-card.js` from the [latest release](https://github.com/Yevgenium/weather-chart-card/releases/latest) into your `config/www` directory.

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

| Name            | Type    | Default                  | Description                                                                                        |
| --------------- | ------- | -------------------------|--------------------------------------------------------------------------------------------------- |
| type            | string  | **Required**             | Should be `custom:weather-chart-card`                                                              |
| entity          | string  | **Required**             | An entity_id with the `weather` domain                                                             |
| title           | string  | none                     | Card title                                                                                         |
| show_main       | boolean | true                     | Show or hide a section with current weather condition amd temperature                              |
| show_attributes | boolean | true                     | Show or hide a section with attributes such as pressure, humidity, wind direction and speed, etc   |
| icons           | string  | none                     | Path to the location of custom icons in svg format, for example `/local/weather-icons/`            |
| icons_size      | number  | 25                       | The size of custom icons in pixels                                                                 |
| units           | object  | none                     | See units of measurement for available options                                                     |
| temp1_color     | string  | rgba(230, 100, 100, 1.0) | Temperature first line chart color                                                                 |
| temp2_color     | string  | rgba(68, 115, 158, 1.0)  | Temperature second line chart color                                                                |
| precip_color    | string  | rgba(132, 209, 253, 1.0) | Precipitation bar chart color                                                                      |

##### Units of measurement

| Name            | Type    | Default                  | Description                                                                                        |
| --------------- | ------- | -------------------------|--------------------------------------------------------------------------------------------------- |
| pressure        | string  | 'hPa'                    | Can be 'hPa' or 'mmHg'                                                                             |
| speed           | string  | 'km/h'                   | Can be 'km/h' or 'm/s'                                                                             |

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
