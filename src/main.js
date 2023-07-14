import { LitElement, html } from 'lit';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

Chart.register(...registerables, ChartDataLabels);

class WeatherChartCard extends LitElement {
  static getStubConfig() {
    return {
      "show_main": true,
      "show_attributes": true,
      "show_humidity": true,
      "show_pressure": true,
      "show_wind_direction": true,
      "show_wind_speed": true
    };
  }

  static get properties() {
    return {
      _hass: {},
      config: {},
      language: {},
      sun: { type: Object },
      weather: { type: Object },
      temperature: { type: Object },
      humidity: { type: Object },
      pressure: { type: Object },
      windSpeed: { type: Object },
      windDirection: { type: Object },
      forecastChart: { type: Object },
      forecastItems: { type: Number }
    };
  }

  setConfig(config) {
    const cardConfig = {
      icons_size: 25,
      ...config,
      forecast: {
        labels_font_size: 11,
        temperature1_color: 'rgba(255, 152, 0, 1.0)',
        temperature2_color: 'rgba(68, 115, 158, 1.0)',
        precipitation_color: 'rgba(132, 209, 253, 1.0)',
        condition_icons: true,
        ...config.forecast,
      },
      units: {
        pressure: 'hPa',
        speed: 'km/h',
        ...config.units,
      }
    };
    this.config = cardConfig;
    if (!config.entity) {
      throw new Error('Please define entity in the card config');
    }
  }

  set hass(hass) {
    this._hass = hass;
    this.language = hass.selectedLanguage || hass.language;
    this.sun = 'sun.sun' in hass.states ? hass.states['sun.sun'] : null;
    this.unitSpeed = this.config.units.speed ? this.config.units.speed : 'km/h';
    this.unitPressure = this.config.units.pressure ? this.config.units.pressure : 'hPa';
    this.weather = this.config.entity in hass.states ?
      hass.states[this.config.entity] : null;
    if (this.weather) {
      this.temperature = this.config.temp ? hass.states[this.config.temp].state : this.weather.attributes.temperature;
      this.humidity = this.config.humid ? hass.states[this.config.humid].state : this.weather.attributes.humidity;
      this.pressure = this.config.press ? hass.states[this.config.press].state : this.weather.attributes.pressure;
      this.windSpeed = this.weather.attributes.wind_speed;
      this.windDirection = this.weather.attributes.wind_bearing;
    }
  }

  constructor() {
    super();
  }

  ll(str) {
    if (locale[this.language] === undefined) return locale.en[str];
    return locale[this.language][str];
  }

  getCardSize() {
    return 4;
  }

  getUnit(unit) {
    return this._hass.config.unit_system[unit] || '';
  }

  getWeatherIcon(condition, sun) {
    if (this.config.icons) {
      return `${this.config.icons}${
        sun == 'below_horizon'
          ? weatherIconsNight[condition]
          : weatherIconsDay[condition]}.svg`
    }
    return weatherIcons[condition];
  }

  getWindDirIcon(deg) {
    return cardinalDirectionsIcon[parseInt((deg + 22.5) / 45.0)];
  }

  getWindDir(deg) {
    return this.ll('cardinalDirections')[parseInt((deg + 11.25) / 22.5)];
  }

  firstUpdated() {
    this.measureCard();
    this.drawChart();
  }

  updated(changedProperties) {
    if (changedProperties.has('config')) {
      this.drawChart();
    }
    if (changedProperties.has('weather')) {
      this.updateChart();
    }
  }

  measureCard() {
    const card = this.shadowRoot.querySelector('ha-card');
    let fontSize = this.config.forecast.labels_font_size;
    if (!card) {
      return;
    }
    this.forecastItems = Math.round(card.offsetWidth / (fontSize * 5.5));
  }

  drawChart({ config, language, weather, forecastItems } = this) {
    if (!weather || !weather.attributes || !weather.attributes.forecast) {
      return [];
    }
    if (this.forecastChart) {
      this.forecastChart.destroy();
    }
    var tempUnit = this._hass.config.unit_system.temperature;
    var lengthUnit = this._hass.config.unit_system.length;
    var precipUnit = lengthUnit === 'km' ? this.ll('units')['mm'] : this.ll('units')['in'];
    var forecast = weather.attributes.forecast.slice(0, forecastItems);
    if ((new Date(forecast[1].datetime) - new Date(forecast[0].datetime)) < 864e5)
      var mode = 'hourly';
    else
      var mode = 'daily';
    var i;
    var dateTime = [];
    var tempHigh = [];
    var tempLow = [];
    var precip = [];
    for (i = 0; i < forecast.length; i++) {
      var d = forecast[i];
      dateTime.push(d.datetime);
      tempHigh.push(d.temperature);
      if (typeof d.templow !== 'undefined') {
        tempLow.push(d.templow);
      }
      precip.push(d.precipitation);
    }
    var style = getComputedStyle(document.body);
    var backgroundColor = style.getPropertyValue('--card-background-color');
    var textColor = style.getPropertyValue('--primary-text-color');
    var dividerColor = style.getPropertyValue('--divider-color');
    const ctx = this.renderRoot.querySelector('#forecastChart').getContext('2d');

    Chart.defaults.color = textColor;
    Chart.defaults.scale.grid.color = dividerColor;
    Chart.defaults.elements.line.fill = false;
    Chart.defaults.elements.line.tension = 0.3;
    Chart.defaults.elements.line.borderWidth = 1.5;
    Chart.defaults.elements.point.radius = 2;
    Chart.defaults.elements.point.hitRadius = 10;

    this.forecastChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: dateTime,
        datasets: [{
          label: this.ll('tempHi'),
          type: 'line',
          data: tempHigh,
          yAxisID: 'TempAxis',
          borderColor: config.forecast.temperature1_color,
          backgroundColor: config.forecast.temperature1_color,
        },
        {
          label: this.ll('tempLo'),
          type: 'line',
          data: tempLow,
          yAxisID: 'TempAxis',
          borderColor: config.forecast.temperature2_color,
          backgroundColor: config.forecast.temperature2_color,
        },
        {
          label: this.ll('precip'),
          type: 'bar',
          data: precip,
          yAxisID: 'PrecipAxis',
          borderColor: config.forecast.precipitation_color,
          backgroundColor: config.forecast.precipitation_color,
          barPercentage: 1.0,
          categoryPercentage: 1.0,
          datalabels: {
            display: function (context) {
              return context.dataset.data[context.dataIndex] > 0 ? 'auto' : false;
            },
            formatter: function (value, context) {
              if (context.dataset.data[context.dataIndex] > 9) {
                return Math.round(context.dataset.data[context.dataIndex]) + ' ' + precipUnit;
              }
              return context.dataset.data[context.dataIndex].toFixed(1) + ' ' + precipUnit;
            },
            align: 'top',
            anchor: 'start',
            offset: -8,
          }
        }]
      },
      options: {
        maintainAspectRatio: false,
        layout: {
          padding: {
            bottom: 10,
          }
        },
        scales: {
          DateTimeAxis: {
            position: 'top',
            grid: {
              drawBorder: false,
              drawTicks: false,
              zeroLineColor: dividerColor,
            },
            ticks: {
              maxRotation: 0,
              padding: 8,
              callback: function (value, index, values) {
                var datetime = this.getLabelForValue(value);
                var weekday = new Date(datetime).toLocaleDateString(language,
                  { weekday: 'short' });
                var time = new Date(datetime).toLocaleTimeString(language,
                  { hour12: false, hour: 'numeric', minute: 'numeric' });
                if (mode == 'hourly') {
                  return time;
                }
                return weekday;
              }
            }
          },
          TempAxis: {
            position: 'left',
            beginAtZero: false,
            suggestedMin: Math.min(...tempHigh, ...tempLow) - 5,
            suggestedMax: Math.max(...tempHigh, ...tempLow) + 3,
            grid: {
              display: false,
              drawBorder: false,
              drawTicks: false,
            },
            ticks: {
              display: false,
            }
          },
          PrecipAxis: {
            position: 'right',
            suggestedMax: lengthUnit === 'km' ? 20 : 1,
            grid: {
              display: false,
              drawBorder: false,
              drawTicks: false,
            },
            ticks: {
              display: false,
            }
          }
        },
        plugins: {
          legend: {
            display: false,
          },
          datalabels: {
            backgroundColor: backgroundColor,
            borderColor: context => context.dataset.backgroundColor,
            borderRadius: 8,
            borderWidth: 1.5,
            padding: 4,
            font: {
              size: config.forecast.labels_font_size,
              lineHeight: 0.7,
            },
            formatter: function (value, context) {
              return context.dataset.data[context.dataIndex] + '°';
            }
          },
          tooltip: {
            caretSize: 0,
            caretPadding: 15,
            callbacks: {
              title: function (TooltipItem) {
                var datetime = TooltipItem[0].label;
                return new Date(datetime).toLocaleDateString(language, {
                  month: 'short',
                  day: 'numeric',
                  weekday: 'short',
                  hour: 'numeric',
                  minute: 'numeric',
                });
              },
              label: function (context) {
                var label = context.dataset.label;
                var value = context.formattedValue;
                if (context.datasetIndex == 2) {
                  return label + ': ' + value + ' ' + precipUnit;
                }
                return label + ': ' + value + ' ' + tempUnit;
              }
            }
          }
        }
      }
    });
  }

  updateChart({ weather, forecastItems, forecastChart } = this) {
    if (!weather || !weather.attributes || !weather.attributes.forecast) {
      return [];
    }
    var forecast = weather.attributes.forecast.slice(0, forecastItems);
    var i;
    var dateTime = [];
    var tempHigh = [];
    var tempLow = [];
    var precip = [];
    for (i = 0; i < forecast.length; i++) {
      var d = forecast[i];
      dateTime.push(d.datetime);
      tempHigh.push(d.temperature);
      if (typeof d.templow !== 'undefined') {
        tempLow.push(d.templow);
      }
      precip.push(d.precipitation);
    }
    if (forecastChart) {
      forecastChart.data.labels = dateTime;
      forecastChart.data.datasets[0].data = tempHigh;
      forecastChart.data.datasets[1].data = tempLow;
      forecastChart.data.datasets[2].data = precip;
      forecastChart.update();
    }
  }

  render() {
    const { config, _hass, weather } = this;
    if (!config || !_hass) {
      return html``;
    }
    if (!weather || !weather.attributes || !weather.attributes.forecast) {
      return html`
        <style>
          .card {
            padding-top: ${config.title ? '0px' : '16px'};
            padding-right: 16px;
            padding-bottom: 16px;
            padding-left: 16px;
          }
        </style>
        <ha-card header="${config.title}">
          <div class="card">
            Please check your weather entity
          </div>
        </ha-card>
      `;
    }
    return html`
      <style>
        ha-icon {
          color: var(--paper-item-icon-color);
        }
        img {
          width: ${config.icons_size}px;
          height: ${config.icons_size}px;
        }
        .card {
          padding-top: ${config.title ? '0px' : '16px'};
          padding-right: 16px;
          padding-bottom: 16px;
          padding-left: 16px;
        }
        .main {
          display: flex;
          align-items: center;
          font-size: 28px;
          margin-bottom: 10px;
        }
        .main ha-icon {
          --mdc-icon-size: 50px;
          margin-right: 14px;
        }
        .main img {
          width: ${config.icons_size * 2}px;
          height: ${config.icons_size * 2}px;
          margin-right: 14px;
        }
        .main div {
          line-height: 0.9;
        }
        .main span {
          font-size: 18px;
          color: var(--secondary-text-color);
        }
        .attributes {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }
        .chart-container {
          position: relative;
          height: 180px;
          width: 100%;
        }
        .conditions {
          display: flex;
          justify-content: space-around;
          margin: 0px 5px 0px 5px;
          cursor: pointer;
        }
      </style>

      <ha-card header="${config.title}">
        <div class="card">
          ${this.renderMain()}
          ${this.renderAttributes()}
          <div class="chart-container">
            <canvas id="forecastChart"></canvas>
          </div>
          ${this.renderForecastConditionIcons()}
        </div>
      </ha-card>
    `;
  }

  renderMain() {
    const { config, weather, sun } = this;
    if (!config.show_main || !weather || !weather.attributes) {
      return html``;
    }
    const condition = weather.state.toLowerCase();
    const temperature = this.temperature ? this.temperature + '°' : '';
    const icon = config.show_condition_icon ?
      html`
        <ha-icon
          .icon="${this.getWeatherIcon(condition, sun ? sun.state : null)}"
        ></ha-icon>
      ` :
      html`
        <img
          src="${this.getWeatherIcon(condition, sun ? sun.state : null)}"
          alt=""
        />
      `;
    const weatherText = config.show_main ? html`<div>${this.ll(condition)}</div>` : '';
    const temperatureText = config.show_main ? html`<span>${temperature}</span>` : '';
    return html`
      <div class="main">
        ${icon}
        <div>
          ${weatherText}
          ${temperatureText}
        </div>
      </div>
    `;
  }

  renderAttributes() {
    const { config, humidity, pressure, windSpeed, windDirection } = this;
    if (!config.show_attributes) {
      return html``;
    }
    const humidityText = config.show_humidity ? html`
      <div>
        <ha-icon icon="mdi:water-percent"></ha-icon>
        ${this.ll('humidity')}: ${humidity ? humidity + '%' : '-'}
      </div>
    ` : '';
    const pressureText = config.show_pressure ? html`
      <div>
        <ha-icon icon="mdi:gauge"></ha-icon>
        ${this.ll('pressure')}: ${pressure ? pressure + ' ' + this.getUnit('pressure') : '-'}
      </div>
    ` : '';
    const windText = config.show_wind_speed ? html`
      <div>
        <ha-icon icon="mdi:weather-windy"></ha-icon>
        ${this.ll('wind')}: ${windSpeed ? windSpeed + ' ' + this.unitSpeed : '-'}
      </div>
    ` : '';
    const windDirectionText = config.show_wind_direction ? html`
      <div>
        <ha-icon icon="mdi:compass-outline"></ha-icon>
        ${this.ll('wind_direction')}: ${windDirection ? this.getWindDir(windDirection) : '-'}
      </div>
    ` : '';
    return html`
      <div class="attributes">
        ${humidityText}
        ${pressureText}
        ${windText}
        ${windDirectionText}
      </div>
    `;
  }

  renderForecastConditionIcons() {
    const { config, weather, sun } = this;
    if (!config.forecast.condition_icons || !weather || !weather.attributes || !weather.attributes.forecast) {
      return html``;
    }
    const forecast = weather.attributes.forecast.slice(0, this.forecastItems);
    return html`
      <div class="conditions">
        ${forecast.map((item) => {
          const condition = item.condition.toLowerCase();
          return html`
            <div>
              <img
                src="${this.getWeatherIcon(condition, sun ? sun.state : null)}"
                alt=""
              />
              <div>${this.ll(condition)}</div>
            </div>
          `;
        })}
      </div>
    `;
  }
}

customElements.define('weather-chart-card', WeatherChartCard);
