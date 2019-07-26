![openweathermap-eng](https://user-images.githubusercontent.com/33804747/50649716-d987f880-0fa8-11e9-9608-93aa8b2857f4.png)

## Configuration

```yaml
# Example Lovelace UI config entry
  - type: 'custom:weather-card-chart'
    title: Weather
    weather: weather.openweathermap
```

#### Configuration variables:

| Name    | Optional | Description                                                                                        |
| ------- | -------- | -------------------------------------------------------------------------------------------------- |
| type    | **No**   | Should be `'custom:weather-card-chart'`                                                            |
| title   | **No**   | Card title                                                                                         |
| weather | **No**   | An entity_id with the `weather` domain                                                             |
| temp    | Yes      | Entity_id of the temperature sensor. Show temperature value from sensor instead                    |
| mode    | Yes      | Default value: `daily`. Set mode to `hourly` to display hours instead weekdays on the chart        |
