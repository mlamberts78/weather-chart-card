import locale from './locale.js';
import {
  cardinalDirectionsIcon,
  weatherIcons,
  weatherIconsDay,
  weatherIconsNight
} from './const.js';
import {LitElement, html} from 'lit';
import './content-card-editor.js';
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
    show_time: false,
    show_day: false,
    show_date: false,
    show_humidity: true,
    show_pressure: true,
    show_wind_direction: true,
    show_wind_speed: true,
    show_sun: true,
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

calculateBeaufortScale(windSpeed) {
  if (windSpeed < 1) return 0;
  else if (windSpeed < 6) return 1;
  else if (windSpeed < 12) return 2;
  else if (windSpeed < 20) return 3;
  else if (windSpeed < 29) return 4;
  else if (windSpeed < 39) return 5;
  else if (windSpeed < 50) return 6;
  else if (windSpeed < 62) return 7;
  else if (windSpeed < 75) return 8;
  else if (windSpeed < 89) return 9;
  else if (windSpeed < 103) return 10;
  else if (windSpeed < 118) return 11;
  else return 12;
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
    this.forecastItems = Math.round(card.offsetWidth / (fontSize * 6));
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
              callback: function(value, index, values) {
              var datetime = this.getLabelForValue(value);
              var dateObj = new Date(datetime);
              var weekday = dateObj.toLocaleString(language, { weekday: 'short' }).toUpperCase();
              var time = dateObj.toLocaleTimeString(language, { hour12: false, hour: 'numeric', minute: 'numeric' });
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
            borderRadius: 0,
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
	  font-weight: 300;
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
          align-items: centery
          font-weight: 300;
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
        .wind-icon {
          margin-right: 1px;
          position: relative;
	  bottom: 1px;
        }
        .wind-speed {
          font-size: 11px;
          margin-right: 1px;
        }
        .wind-unit {
          font-size: 9px;
          margin-left: 1px;
        }
        .current-time {
          position: absolute;
          top: 20px;
          right: 16px;
          font-size: clamp(16px, 2.5vw, 24px);
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
          ${this.renderForecastConditionIcons()}
          ${this.renderWind()}
        </div>
      </ha-card>
    `;
  }

renderMain({ config, sun, weather, temperature } = this) {
  if (config.show_main === false)
    return html``;

  const currentDate = new Date();
  const currentTime = currentDate.toLocaleTimeString(this.language, { hour: 'numeric', minute: 'numeric' });
  const currentDayOfWeek = currentDate.toLocaleString(this.language, { weekday: 'short' }).toUpperCase();
  const currentDateFormatted = currentDate.toLocaleDateString(this.language, { month: 'short', day: 'numeric' });
  const showTime = config.show_time === true;
  const showDay = config.show_day === true;
  const showDate = config.show_date === true;

  return html`
    <div class="main">
      ${config.icons ?
        html`
          <img
            src="${this.getWeatherIcon(weather.state, sun.state)}"
            alt=""
          >
        ` :
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
        ${showTime ? html`
          <div class="current-time">
            ${showDay ? html`${currentDayOfWeek}` : ''}
            ${showDay && showDate ? html` ` : ''}
            ${showDate ? html`${currentDateFormatted}` : ''}
            ${currentTime}
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

renderAttributes({ config, humidity, pressure, windSpeed, windDirection, sun, language } = this) {
  let dWindSpeed;

  if (this.unitSpeed === 'm/s') {
    dWindSpeed = Math.round(windSpeed * 1000 / 3600);
  } else if (this.unitSpeed === 'Bft') {
    dWindSpeed = this.calculateBeaufortScale(windSpeed);
  } else {
    dWindSpeed = Math.round(windSpeed);
  }

  if (this.unitPressure === 'mmHg') {
    pressure *= 0.75;
  }

  if (!config.show_attributes) {
    return html``;
  }

  const showHumidity = config.show_humidity !== false;
  const showPressure = config.show_pressure !== false;
  const showWindDirection = config.show_wind_direction !== false;
  const showWindSpeed = config.show_wind_speed !== false;
  const showSun = config.show_sun !== false;

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
      ${showSun ? html`
        <div>
          ${this.renderSun({ sun, language })}
        </div>
      ` : ''}
      ${showWindDirection || showWindSpeed ? html`
        <div>
          ${showWindDirection ? html`
            <ha-icon icon="hass:${this.getWindDirIcon(windDirection)}"></ha-icon> ${this.getWindDir(windDirection)}<br>
          ` : ''}
          ${showWindSpeed ? html`
            <ha-icon icon="hass:weather-windy"></ha-icon>
            ${dWindSpeed} ${this.unitSpeed}
          ` : ''}
        </div>
      ` : ''}
    </div>
  `;
}

renderSun({ sun, language } = this) {
  if (sun == undefined) {
    return html``;
  }
  return html`
    <ha-icon icon="mdi:weather-sunset-up"></ha-icon>
      ${new Date(sun.attributes.next_rising).toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' })}<br>
    <ha-icon icon="mdi:weather-sunset-down"></ha-icon>
      ${new Date(sun.attributes.next_setting).toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' })}
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
          let dWindSpeed;

          if (this.unitSpeed === 'm/s') {
            dWindSpeed = Math.round(item.wind_speed * 1000 / 3600); // Convert to m/s
          } else if (this.unitSpeed === 'Bft') {
            dWindSpeed = this.calculateBeaufortScale(item.wind_speed);
          } else {
            dWindSpeed = Math.round(item.wind_speed);
          }

          return html`
            <div class="wind-detail">
              <ha-icon class="wind-icon" icon="hass:${this.getWindDirIcon(item.wind_bearing)}"></ha-icon>
              <span class="wind-speed">${dWindSpeed}</span>
              <span class="wind-unit">${this.unitSpeed}</span>
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

window.customCards = window.customCards || [];
window.customCards.push({
  type: "weather-chart-card",
  name: "Weather Chart Card",
  description: "A custom weather card with chart.",
  preview: true,
  documentationURL: "https://github.com/mlamberts78/weather-chart-card",
});
