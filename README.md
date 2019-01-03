# Weather card

![openweathermap-eng](https://user-images.githubusercontent.com/33804747/50649716-d987f880-0fa8-11e9-9608-93aa8b2857f4.png)

## Configuration

Copy `custom-weather-card-chart.js` from this repository into your `config/www` directory first.

```yaml
# Example ui-lovelace.yaml entry
resources:
- type: module
  url: /local/custom-weather-card-chart.js
title: Home Assistant
views:
- title: Main
  cards:
  - type: 'custom:weather-card-chart'
    title: Weather
    weather: weather.openweathermap
    sun: sun.sun
```
#### Configuration variables:

| Name    | Optional | Description                                                                     |
| ------- | -------- | ------------------------------------------------------------------------------- |
| type    | **No**   | Should be `'custom:weather-card-chart'`                                         |
| title   | **No**   | Card title                                                                      |
| weather | **No**   | An entity_id with the `weather` domain                                          |
| sun     | Yes      | Should be `sun.sun`. Show sunrise and sunset time                               |
| temp    | Yes      | Entity_id of the temperature sensor. Show temperature value from sensor instead |
