import locale from './locale.js';
import {
  cardinalDirectionsIcon,
  weatherIcons,
  weatherIconsDay,
  weatherIconsNight
} from './const.js';
import {LitElement, html} from 'lit';
import { property } from 'lit/decorators.js';
import {Chart, registerables} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
Chart.register(...registerables, ChartDataLabels);

class WeatherChartCard extends LitElement {

static getConfigElement() {
  return document.createElement("content-card-editor");
}

static getStubConfig(hass, unusedEntities, allEntities) {
  let entity = unusedEntities.find((eid) => eid.split(".")[0] === "weather");
  if (!entity) {
    entity = allEntities.find((eid) => eid.split(".")[0] === "weather");
  }
  return {
    entity,
    show_main: true,
    show_attributes: true,
    show_humidity: true,
    show_pressure: true,
    show_wind_direction: true,
    show_wind_speed: true,
    forecast: {
      labels_font_size: '11',
      show_wind_forecast: true,
      condition_icons: true,
    },
    units: {
      pressure: 'hPa',
      speed: 'km/h',
    },
  };
}

  static get properties() {
    return {
      _hass: {},
      config: {},
      language: {},
      sun: {type: Object},
      weather: {type: Object},
      temperature: {type: Object},
      humidity: {type: Object},
      pressure: {type: Object},
      windSpeed: {type: Object},
      windDirection: {type: Object},
      forecastChart: {type: Object},
      forecastItems: {type: Number}
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
        show_wind_forecast: true,
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
      throw new Error('Please, define entity in the card config');
    };
  }

  set hass(hass) {
    this._hass = hass;
    this.language = hass.selectedLanguage || hass.language;
    this.sun = 'sun.sun' in hass.states ? hass.states['sun.sun'] : null;
    this.unitSpeed = this.config.units.speed ? this.config.units.speed : 'km/h';
    this.unitPressure = this.config.units.pressure ? this.config.units.pressure : 'hPa';
    this.weather = this.config.entity in hass.states
      ? hass.states[this.config.entity] : null;
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
    };
    if (changedProperties.has('weather')) {
      this.updateChart();
    };
  }

  measureCard() {
    const card = this.shadowRoot.querySelector('ha-card');
    let fontSize = this.config.forecast.labels_font_size;
    if (!card) {
      return;
    }
    this.forecastItems = Math.round(card.offsetWidth / (fontSize * 5.5));
  }

  drawChart({config, language, weather, forecastItems} = this) {
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
            display: function(context) {
              return context.dataset.data[context.dataIndex] > 0 ? 'auto' : false;
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

  updateChart({weather, forecastItems, forecastChart} = this) {
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

  render({config, _hass, weather} = this) {
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
          align-items: centery
          margin: 0px 5px 0px 5px;
	  cursor: pointer;
        }
        .forecast-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin: 1px;
        }
        .wind-details {
          display: flex;
          justify-content: space-around;
          margin: 0px 5px 0px 5px;
        }
        .wind-detail {
          display: flex;
          align-items: center;
          margin: 1px;
        }
        .wind-detail ha-icon {
          --mdc-icon-size: 15px;
          margin-right: 1px;
        }
        .wind-detail span {
          display: flex;
          align-items: center;
        }
        .wind-icon {
          margin-right: 2px;
        }
        .wind-speed {
          font-size: 11px;
          margin-right: 1px;
        }
        .wind-unit {
          font-size: 8px;
          margin-left: 1px;
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
          ${this.renderWind()}
        </div>
      </ha-card>
    `;
  }

  renderMain({config, sun, weather, temperature} = this) {
    if (config.show_main == false)
      return html``;
    return html`
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
          <div>
            ${temperature}<span>
            ${this.getUnit('temperature')}</span>
          </div>
          <span>${this.ll(weather.state)}</span>
        </div>
      </div>
    `;
  }

  renderAttributes({config, humidity, pressure, windSpeed, windDirection} = this) {
    if (this.unitSpeed === 'm/s') {
      windSpeed = Math.round(windSpeed * 1000 / 3600);
    }
    if (this.unitPressure === 'mmHg') {
      pressure = pressure * 0.75;
    }
    if (config.show_attributes == false)
      return html``;

    const showHumidity = config.show_humidity !== false;
    const showPressure = config.show_pressure !== false;
    const showWindDirection = config.show_wind_direction !== false;
    const showWindSpeed = config.show_wind_speed !== false;

    return html`
      <div class="attributes">
        ${showHumidity || showPressure ? html`
          <div>
	    ${showHumidity ? html`
            <ha-icon icon="hass:water-percent"></ha-icon> ${humidity} %<br>
           ` : ''}
           ${showPressure ? html`
            <ha-icon icon="hass:gauge"></ha-icon> ${Math.round(pressure)} ${this.ll('units')[config.units.pressure]}
           ` : ''}
          </div>
        ` : ''}
        <div>
          ${this.renderSun()}
        </div>
        ${showWindDirection || showWindSpeed ? html`
          <div>
            ${showWindDirection ? html`
              <ha-icon icon="hass:${this.getWindDirIcon(windDirection)}"></ha-icon> ${this.getWindDir(windDirection)}<br>
            ` : ''}
            ${showWindSpeed ? html`
              <ha-icon icon="hass:weather-windy"></ha-icon> ${windSpeed} ${this.ll('units')[config.units.speed]}
            ` : ''}
          </div>
        ` : ''}
      </div>
     `;
  }

  renderSun({sun, language} = this) {
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

renderForecastConditionIcons({ config, weather, forecastItems } = this) {
  const forecast = weather.attributes.forecast.slice(0, forecastItems);

  if (config.forecast.condition_icons === false) {
    return html``;
  }

  return html`
    <div class="conditions" @click="${(e) => this.showMoreInfo(config.entity)}">
      ${forecast.map((item) => html`
        <div class="forecast-item">
          ${config.icons ?
            html`
              <img class="icon" src="${this.getWeatherIcon(item.condition)}" alt="">
            ` :
            html`
              <ha-icon icon="${this.getWeatherIcon(item.condition)}"></ha-icon>
            `
          }
        </div>
      `)}
    </div>
  `;
}

renderWind({ config, weather, windSpeed, windDirection, forecastItems } = this) {
  const showWindForecast = config.forecast.show_wind_forecast !== false;

  if (!showWindForecast) {
    return html``;
  }

  const forecast = weather.attributes.forecast.slice(0, forecastItems);

  return html`
    <div class="wind-details">
      ${showWindForecast ? html`
        ${forecast.map((item) => {
          let dWindSpeed = item.wind_speed;

          if (config.units.speed === 'm/s') {
            dWindSpeed = Math.round(item.wind_speed * 1000 / 3600); // Convert to m/s
          } else {
            dWindSpeed = Math.round(item.wind_speed);
          }

          return html`
            <div class="wind-detail">
              <ha-icon class="wind-icon" icon="hass:${this.getWindDirIcon(item.wind_bearing)}"></ha-icon>
              <span class="wind-speed">${dWindSpeed}</span>
              <span class="wind-unit">${this.ll('units')[config.units.speed]}</span>
            </div>
          `;
        })}
      ` : ''}
    </div>
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


class ContentCardEditor extends LitElement {

  static get properties() {
    return {
      config: {},
    };
  }

  setConfig(config) {
    this._config = config;
  }

  configChanged(newConfig) {
    const event = new Event("config-changed", {
      bubbles: true,
      composed: true,
    });
    event.detail = { config: newConfig };
    this.dispatchEvent(event);
  }

_valueChanged(event, key) {
  if (!this._config) {
    return;
  }

  const newConfig = JSON.parse(JSON.stringify(this._config)); // Deep clone to prevent mutation of the original object

  const keys = key.split('.'); // Split the key to handle nested properties
  let targetConfig = newConfig;

  for (let i = 0; i < keys.length - 1; i++) {
    const currentKey = keys[i];
    if (!targetConfig[currentKey]) {
      targetConfig[currentKey] = {}; // Create an empty object if the nested property doesn't exist
    }
    targetConfig = targetConfig[currentKey];
  }

  const lastKey = keys[keys.length - 1];
  if (lastKey === 'entity') {
    targetConfig[lastKey] = event.target.value;
  } else {
    targetConfig[lastKey] = event.target.checked !== undefined ? event.target.checked : event.target.value;
  }

  this.configChanged(newConfig);
}

  render() {
    const forecastConfig = this._config.forecast || {};
    const unitsConfig = this._config.units || {};

    return html`
      <style>
        .switch-label {
          padding-left: 14px;
        }
        .switch-container {
          margin-bottom: 12px;
        }
      </style>
      <div>
        <paper-input
          label="Entity"
          .value="${this._config.entity || ''}"
          @value-changed="${(e) => this._valueChanged(e, 'entity')}"
        ></paper-input>
        <paper-input
          label="Title"
          .value="${this._config.title || ''}"
          @value-changed="${(e) => this._valueChanged(e, 'title')}"
        ></paper-input>
	<h4>Card setting</h4>
        <div class="switch-container">
          <ha-switch
            @change="${(e) => this._valueChanged(e, 'show_main')}"
            .checked="${this._config.show_main !== false}"
          ></ha-switch>
          <label class="switch-label">
            Show Main
          </label>
        </div>
        <div class="switch-container">
          <ha-switch
            @change="${(e) => this._valueChanged(e, 'show_attributes')}"
            .checked="${this._config.show_attributes !== false}"
          ></ha-switch>
          <label class="switch-label">
            Show Attributes
          </label>
        </div>
        <div class="switch-container">
          <ha-switch
            @change="${(e) => this._valueChanged(e, 'show_humidity')}"
            .checked="${this._config.show_humidity !== false}"
          ></ha-switch>
          <label class="switch-label">
            Show Humidity
          </label>
        </div>
        <div class="switch-container">
          <ha-switch
            @change="${(e) => this._valueChanged(e, 'show_pressure')}"
            .checked="${this._config.show_pressure !== false}"
          ></ha-switch>
          <label class="switch-label">
            Show Pressure
          </label>
        </div>
        <div class="switch-container">
          <ha-switch
            @change="${(e) => this._valueChanged(e, 'show_wind_direction')}"
            .checked="${this._config.show_wind_direction !== false}"
          ></ha-switch>
          <label class="switch-label">
            Show Wind Direction
          </label>
        </div>
        <div class="switch-container">
          <ha-switch
            @change="${(e) => this._valueChanged(e, 'show_wind_speed')}"
            .checked="${this._config.show_wind_speed !== false}"
          ></ha-switch>
          <label class="switch-label">
            Show Wind Speed
          </label>
        </div>
        <div>
          <h4>Forecast settings</h4>
          <paper-input
            label="Labels Font Size"
            .value="${forecastConfig.labels_font_size || '11'}"
            @value-changed="${(e) => this._valueChanged(e, 'forecast.labels_font_size')}"
          ></paper-input>
          <div class="switch-container">
            <ha-switch
              @change="${(e) => this._valueChanged(e, 'forecast.show_wind_forecast')}"
              .checked="${forecastConfig.show_wind_forecast !== false}"
            ></ha-switch>
            <label class="switch-label">
              Show Wind Forecast
            </label>
          </div>
          <div class="switch-container">
            <ha-switch
              @change="${(e) => this._valueChanged(e, 'forecast.condition_icons')}"
              .checked="${forecastConfig.condition_icons !== false}"
            ></ha-switch>
            <label class="switch-label">
              Condition Icons
            </label>
          </div>
        </div>
        <div>
          <h4>Units</h4>
          <paper-input
            label="Pressure"
            .value="${unitsConfig.pressure || 'hPa'}"
            @value-changed="${(e) => this._valueChanged(e, 'units.pressure')}"
          ></paper-input>
          <paper-input
            label="Speed"
            .value="${unitsConfig.speed || 'km/h'}"
            @value-changed="${(e) => this._valueChanged(e, 'units.speed')}"
          ></paper-input>
        </div>
      </div>
    `;
  }
}
customElements.define("content-card-editor", ContentCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "weather-chart-card",
  name: "Weather Chart Card",
  description: "A custom weather card with chart.",
  preview: true,
  documentationURL: "https://github.com/mlamberts78/weather-chart-card",
});
