import locale from './locale.js';
import {
  cardinalDirectionsIcon,
  weatherIcons,
  weatherIconsDay,
  weatherIconsNight
} from './const.js';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
Chart.register(...registerables, ChartDataLabels);

const LitElement = Object.getPrototypeOf(customElements.get("ha-panel-lovelace"));
const html = LitElement.prototype.html;

class WeatherChartCard extends LitElement {

  static getStubConfig() {
    return {
      "show_attributes": true,
      "show_main": true
    };
  }

  static get properties() {
    return {
      _hass: {},
      config: {},
      language: {},
      sun: {type: Object},
      iconSize: {type: Number},
      weather: {type: Object},
      temperature: {type: Object},
      forecastChart: {type: Object},
      forecastItems: {type: Number}
    };
  }

  setConfig(config) {
    if (!config.weather) {
      throw new Error('Please, define "weather" entity in the card config');
    };
    this.config = config;
  }

  set hass(hass) {
    this._hass = hass;
    this.language = this._hass.selectedLanguage || this._hass.language;
    this.sun = 'sun.sun' in hass.states ? hass.states['sun.sun'] : null;
    this.weather = this.config.weather in hass.states ? hass.states[this.config.weather] : null;
    this.temperature = this.config.temp in hass.states ? hass.states[this.config.temp].state : null;
    this.iconSize = this.config.icons_size ? this.config.icons_size : 25;
  }

  constructor() {
    super();
  }

  ll(str) {
    if (locale[this.language] === undefined)
      return locale.en[str];
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

  getWeatherCondition(condition) {
    return ll(condition);
  }

  getWindDirIcon(deg) {
    return cardinalDirectionsIcon[parseInt((deg + 22.5) / 45.0)];
  }

  getWindDir(deg) {
    return ll('cardinalDirections')[parseInt((deg + 11.25) / 22.5)];
  }

  firstUpdated() {
    this.measureCard();
    this.drawChart();
  }

  updated(changedProperties) {
    if (changedProperties.has('config')) {
      this.drawChart();
    };
    if (changedProperties.has('weather')) {
      this.updateChart();
    };
  }

  measureCard() {
    const card = this.shadowRoot.querySelector('ha-card');
    if (!card) {
      return;
    }
    this.forecastItems = Math.round(card.offsetWidth / 56);
  }

  drawChart({ config, language, weather, forecastItems } = this) {
    if (!weather || !weather.attributes || !weather.attributes.forecast) {
      return [];
    }
    if (this.forecastChart) {
      this.forecastChart.destroy();
    }
    var tempHiColor = config.temp1_color ? config.temp1_color : 'rgba(230, 100, 100, 1.0)';
    var tempLoColor = config.temp2_color ? config.temp2_color : 'rgba(68, 115, 158, 1.0)';
    var precipColor = config.precip_color ? config.precip_color : 'rgba(132, 209, 253, 1.0)';
    var tempUnit = this._hass.config.unit_system.temperature;
    var lengthUnit = this._hass.config.unit_system.length;
    var precipUnit = lengthUnit === 'km' ? ll('uPrecip')[0] : ll('uPrecip')[1];
    var forecast = weather.attributes.forecast.slice(0, forecastItems);
    if (new Date(forecast[1].datetime) - new Date(forecast[0].datetime) === 36e5)
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
          borderColor: tempHiColor,
          backgroundColor: tempHiColor,
        },
        {
          label: this.ll('tempLo'),
          type: 'line',
          data: tempLow,
          yAxisID: 'TempAxis',
          borderColor: tempLoColor,
          backgroundColor: tempLoColor,
        },
        {
          label: this.ll('precip'),
          type: 'bar',
          data: precip,
          yAxisID: 'PrecipAxis',
          borderColor: precipColor,
          backgroundColor: precipColor,
          barPercentage: 1.0,
          categoryPercentage: 1.0,
          datalabels: {
            display: function(context) {
              return context.dataset.data[context.dataIndex] !== 0 ? 'auto' : false;
            },
            formatter: function(value, context) {
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
              callback: function(value, index, values) {
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
            suggestedMax: 20,
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
            borderColor: function(context) {
              return context.dataset.backgroundColor;
            },
            borderRadius: 8,
            borderWidth: 1.5,
            padding: 4,
            font: {
              size: 10,
              weight: 'bold',
              lineHeight: 0.6,
            },
            formatter: function(value, context) {
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
              label: function(context) {
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

  render({ config, _hass, weather, forecastItems } = this) {
    if (!config || !_hass) {
      return html``;
    }
    if (!weather || !weather.attributes || !weather.attributes.forecast) {
      return html`
        <style>
          .card {
            padding-top: ${config.title? '0px' : '16px'};
            padding-right: 16px;
            padding-bottom: 16px;
            padding-left: 16px;
          }
        </style>
        <ha-card header="${config.title}">
          <div class="card">
            Please, check your weather entity
          </div>
        </ha-card>
      `;
    }
    const forecast = weather.attributes.forecast.slice(0, forecastItems);
    return html`
      <style>
        ha-icon {
          color: var(--paper-item-icon-color);
        }
        img {
          width: ${this.iconSize}px;
          height: ${this.iconSize}px;
        }
        .card {
          padding-top: ${config.title? '0px' : '16px'};
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
          width: ${this.iconSize * 2}px;
          height: ${this.iconSize * 2}px;
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
        .more-info {
          position: absolute;
          cursor: pointer;
          top: 4px;
          right: 4px;
          color: var(--secondary-text-color);
        }
      </style>

      <ha-card header="${config.title}">
        <div class="card">
          ${this.renderMain()}
          ${this.renderAttributes()}
          <div class="chart-container">
            <canvas id="forecastChart"></canvas>
          </div>
          <div
            class="conditions"
            @click="${(e) => this.showMoreInfo(config.weather)}"
          >
            ${forecast.map((item) => html`
              ${config.icons ?
                html`
                  <img class="icon"
                    src="${this.getWeatherIcon(item.condition)}"
                    alt=""
                  >
                `:
                html`
                  <ha-icon icon="${this.getWeatherIcon(item.condition)}"></ha-icon>
                `
              }
            `)}
          </div>
        </div>
      </ha-card>
    `;
  }

  renderMain({ config, sun, weather, temperature } = this) {
    if (config.show_main == false)
      return html``;
    return html`
      <ha-icon-button
        class="more-info"
        icon="hass:dots-vertical"
        @click="${(e) => this.showMoreInfo(config.weather)}"
      ></ha-icon-button>
      <div class="main">
        ${config.icons ?
          html`
            <img
              src="${this.getWeatherIcon(weather.state, sun.state)}"
              alt=""
            >
          `:
          html`
            <ha-icon icon="${this.getWeatherIcon(weather.state)}"></ha-icon>
          `
        }
        <div>
          ${temperature?
            html`
              <div>
                ${temperature}
                <span>${this.getUnit('temperature')}</span>
              </div>
            `:
            html`
              <div>
                ${weather.attributes.temperature}
                <span>${this.getUnit('temperature')}</span>
              </div>
            `
          }
          <span>${this.getWeatherCondition(weather.state)}</span>
        </div>
      </div>
    `;
  }

  renderAttributes({ config, weather } = this) {
    const pressure = Math.round(weather.attributes.pressure);
    const humidity = Math.round(weather.attributes.humidity);
    const windDir = weather.attributes.wind_bearing;
    const windSpeed = Math.round(weather.attributes.wind_speed * 1000 / 3600);
    if (config.show_attributes == false)
      return html``;
    return html`
      <div class="attributes">
        <div>
          <ha-icon icon="hass:water-percent"></ha-icon> ${humidity} %<br>
          <ha-icon icon="hass:gauge"></ha-icon> ${pressure} ${this.ll('uPress')}
        </div>
        <div>
          ${this.renderSun()}
        </div>
        <div>
          <ha-icon icon="hass:${this.getWindDirIcon(windDir)}"></ha-icon> ${this.getWindDir(windDir)}<br>
          <ha-icon icon="hass:weather-windy"></ha-icon> ${windSpeed} ${this.ll('uSpeed')}
        </div>
      </div>
    `;
  }

  renderSun({ sun, language } = this) {
    if ( sun == undefined)
      return html``;
    return html`
      <ha-icon icon="mdi:weather-sunset-up"></ha-icon>
        ${new Date(sun.attributes.next_rising).toLocaleTimeString(language,
        {hour:'2-digit', minute:'2-digit'})}<br>
      <ha-icon icon="mdi:weather-sunset-down"></ha-icon>
        ${new Date(sun.attributes.next_setting).toLocaleTimeString(language,
        {hour:'2-digit', minute:'2-digit'})}
    `;
  }

  _fire(type, detail, options) {
    const node = this.shadowRoot;
    options = options || {};
    detail = (detail === null || detail === undefined) ? {} : detail;
    const event = new Event(type, {
      bubbles: options.bubbles === undefined ? true : options.bubbles,
      cancelable: Boolean(options.cancelable),
      composed: options.composed === undefined ? true : options.composed
    });
    event.detail = detail;
    node.dispatchEvent(event);
    return event;
  }

  showMoreInfo(entity) {
    this._fire('hass-more-info', { entityId: entity });
  }
}

customElements.define('weather-chart-card', WeatherChartCard);
