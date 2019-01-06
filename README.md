# Weather card

![openweathermap-eng](https://user-images.githubusercontent.com/33804747/50649716-d987f880-0fa8-11e9-9608-93aa8b2857f4.png)

## Configuration

Copy `custom-weather-card-chart.js` from this repository into your `config/www` directory first.

Add a reference to the copied file:
```yaml
# Example ui-lovelace.yaml entry
resources:
- type: module
  url: /local/custom-weather-card-chart.js
```
Then you can add the card to the view:
```yaml
# Example ui-lovelace.yaml entry
  - type: 'custom:weather-card-chart'
    title: Weather
    weather: weather.openweathermap
    sun: sun.sun
```
You can update this card using [custom updater](https://github.com/custom-components/custom_updater). To do this, add these lines to `custom_updater` configuration in `configuration.yaml`:
```yaml
# Example configuration.yaml entry
custom_updater:
  card_urls:
    - https://raw.githubusercontent.com/sgttrs/lovelace-weather-card-chart/master/custom-updater.json
```

#### Configuration variables:

| Name    | Optional | Description                                                                     |
| ------- | -------- | ------------------------------------------------------------------------------- |
| type    | **No**   | Should be `'custom:weather-card-chart'`                                         |
| title   | **No**   | Card title                                                                      |
| weather | **No**   | An entity_id with the `weather` domain                                          |
| sun     | Yes      | Should be `sun.sun`. Show sunrise and sunset time                               |
| temp    | Yes      | Entity_id of the temperature sensor. Show temperature value from sensor instead |
