const locale = {
  da: {
    tempHi: "Temperatur",
    tempLo: "Temperatur nat",
    precip: "Nedbør",
    uPress: "hPa",
    uSpeed: "m/s",
    uPrecip: "mm",
    cardinalDirections: [
      'N', 'N-NØ', 'NØ', 'Ø-NØ', 'Ø', 'Ø-SØ', 'SØ', 'S-SØ',
      'S', 'S-SV', 'SV', 'V-SV', 'V', 'V-NV', 'NV', 'N-NV', 'N'
    ]
  },
  de: {
    tempHi: "Höchsttemperatur",
    tempLo: "Tiefsttemperatur",
    precip: "Niederschlag",
    uPress: "hPa",
    uSpeed: "m/s",
    uPrecip: "mm",
    cardinalDirections: [
      'N', 'N-NO', 'NO', 'O-NO', 'O', 'O-SO', 'SO', 'S-SO',
      'S', 'S-SW', 'SW', 'W-SW', 'W', 'W-NW', 'NW', 'N-NW', 'N'
    ]
  },
  en: {
    tempHi: "Temperature",
    tempLo: "Temperature night",
    precip: "Precipitations",
    uPress: "hPa",
    uSpeed: "m/s",
    uPrecip: "mm",
    cardinalDirections: [
      'N', 'N-NE', 'NE', 'E-NE', 'E', 'E-SE', 'SE', 'S-SE',
      'S', 'S-SW', 'SW', 'W-SW', 'W', 'W-NW', 'NW', 'N-NW', 'N'
    ]
  },
  es: {
    tempHi: "Temperatura máxima",
    tempLo: "Temperatura mínima",
    precip: "Precipitations",
    uPress: "hPa",
    uSpeed: "m/s",
    uPrecip: "mm",
    cardinalDirections: [
      'N', 'N-NE', 'NE', 'E-NE', 'E', 'E-SE', 'SE', 'S-SE',
      'S', 'S-SO', 'SO', 'O-SO', 'O', 'O-NO', 'NO', 'N-NO', 'N'
    ]
  },
  fr: {
    tempHi: "Température",
    tempLo: "Température nuit",
    precip: "Précipitations",
    uPress: "hPa",
    uSpeed: "m/s",
    uPrecip: "mm",
    cardinalDirections: [
      'N', 'N-NE', 'NE', 'E-NE', 'E', 'E-SE', 'SE', 'S-SE',
      'S', 'S-SO', 'SO', 'O-SO', 'O', 'O-NO', 'NO', 'N-NO', 'N'
    ]
  },
  nl: {
    tempHi: "Maximum temperatuur",
    tempLo: "Minimum temperatuur",
    precip: "Neerslag",
    uPress: "hPa",
    uSpeed: "m/s",
    uPrecip: "mm",
    cardinalDirections: [
      'N', 'N-NO', 'NO', 'O-NO', 'O', 'O-ZO', 'ZO', 'Z-ZO',
      'Z', 'Z-ZW', 'ZW', 'W-ZW', 'W', 'W-NW', 'NW', 'N-NW', 'N'
    ]
  },
  ru: {
    tempHi: "Температура",
    tempLo: "Температура ночью",
    precip: "Осадки",
    uPress: "гПа",
    uSpeed: "м/с",
    uPrecip: "мм",
    cardinalDirections: [
      'С', 'С-СВ', 'СВ', 'В-СВ', 'В', 'В-ЮВ', 'ЮВ', 'Ю-ЮВ',
      'Ю', 'Ю-ЮЗ', 'ЮЗ', 'З-ЮЗ', 'З', 'З-СЗ', 'СЗ', 'С-СЗ', 'С'
    ]
  },
  sv: {
    tempHi: "Temperatur",
    tempLo: "Temperatur natt",
    precip: "Nederbörd",
    uPress: "hPa",
    uSpeed: "m/s",
    uPrecip: "mm",
    cardinalDirections: [
      'N', 'N-NO', 'NO', 'O-NO', 'O', 'O-SO', 'SO', 'S-SO',
      'S', 'S-SV', 'SV', 'V-SV', 'V', 'V-NV', 'NV', 'N-NV', 'N'
    ]
  }
};

class WeatherCardChart extends Polymer.Element {

  static get template() {
    return Polymer.html`
      <style>
        ha-icon {
          color: var(--paper-item-icon-color);
        }
        .card {
          padding: 0 18px 18px 18px;
        }
        .main {
          display: flex;
          align-items: center;
          font-size: 60px;
          font-weight: 350;
          margin-top: -10px;
        }
        .main ha-icon {
          --iron-icon-height: 74px;
          --iron-icon-width: 74px;
          --mdc-icon-size: 74px;
          margin-right: 20px;
        }
        .main div {
          cursor: pointer;
          margin-top: -11px;
        }
        .main sup {
          font-size: 32px;
        }
        .attributes {
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 10px 0px 10px 0px;
        }
        .attributes div {
          text-align: left;
        }
        .conditions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 0px 3px 0px 16px;
        }
      </style>
      <ha-card header="[[title]]">
        <div class="card">
          <div class="main">
            <ha-icon icon="[[getWeatherIcon(weatherObj.state)]]"></ha-icon>
            <template is="dom-if" if="[[tempObj]]">
              <div on-click="_tempAttr">[[roundNumber(tempObj.state)]]<sup>[[getUnit('temperature')]]</sup></div>
            </template>
            <template is="dom-if" if="[[!tempObj]]">
              <div on-click="_weatherAttr">[[roundNumber(weatherObj.attributes.temperature)]]<sup>[[getUnit('temperature')]]</sup></div>
            </template>
          </div>
          <div class="attributes" on-click="_weatherAttr">
            <div>
              <ha-icon icon="hass:water-percent"></ha-icon> [[roundNumber(weatherObj.attributes.humidity)]] %<br>
              <ha-icon icon="hass:gauge"></ha-icon> [[roundNumber(weatherObj.attributes.pressure)]] [[ll('uPress')]]
            </div>
            <div>
              <template is="dom-if" if="[[sunObj]]">
                <ha-icon icon="mdi:weather-sunset-up"></ha-icon> [[computeTime(sunObj.attributes.next_rising)]]<br>
                <ha-icon icon="mdi:weather-sunset-down"></ha-icon> [[computeTime(sunObj.attributes.next_setting)]]
              </template>
            </div>
            <div>
              <ha-icon icon="[[getWindDirIcon(windBearing)]]"></ha-icon> [[getWindDir(windBearing)]]<br>
              <ha-icon icon="hass:weather-windy"></ha-icon>
              <template is="dom-if" if="[[windObj]]">
                [[roundNumber(windObj.state)]] [[ll('uSpeed')]]                
              </template>
              <template is="dom-if" if="[[!windObj]]">
                [[computeWind(weatherObj.attributes.wind_speed)]] [[ll('uSpeed')]]
              </template>
            </div>
          </div>
          <ha-chart-base data="[[ChartData]]" options="[[ChartOptions]]"></ha-chart-base>
          <div class="conditions">
            <template is="dom-repeat" items="[[forecast]]">
              <div>
                <ha-icon icon="[[getWeatherIcon(item.condition)]]"></ha-icon>
              </div>
            </template>
          </div>
        </div>
      </ha-card>
    `;
  }

  static get properties() {
    return {
      config: Object,
      sunObj: Object,
      tempObj: Object,
      windObj: Object,
      mode: String,
      weatherObj: {
        type: Object,
        observer: 'dataChanged',
      },
    };
  }

  constructor() {
    super();
    this.mode = 'daily';
    this.weatherIcons = {
      'clear-night': 'hass:weather-night',
      'cloudy': 'hass:weather-cloudy',
      'fog': 'hass:weather-fog',
      'hail': 'hass:weather-hail',
      'lightning': 'hass:weather-lightning',
      'lightning-rainy': 'hass:weather-lightning-rainy',
      'partlycloudy': 'hass:weather-partly-cloudy',
      'pouring': 'hass:weather-pouring',
      'rainy': 'hass:weather-rainy',
      'snowy': 'hass:weather-snowy',
      'snowy-rainy': 'hass:weather-snowy-rainy',
      'sunny': 'hass:weather-sunny',
      'windy': 'hass:weather-windy',
      'windy-variant': 'hass:weather-windy-variant'
    };
    this.cardinalDirectionsIcon = [
      'mdi:arrow-down', 'mdi:arrow-bottom-left', 'mdi:arrow-left',
      'mdi:arrow-top-left', 'mdi:arrow-up', 'mdi:arrow-top-right',
      'mdi:arrow-right', 'mdi:arrow-bottom-right', 'mdi:arrow-down'
    ];
  }

  setConfig(config) {
    this.config = config;
    this.title = config.title;
    this.weatherObj = config.weather;
    this.tempObj = config.temp;
    this.windObj = config.wind;
    this.mode = config.mode;
    if (!config.weather) {
      throw new Error('Please define "weather" entity in the card config');
    }
  }

  set hass(hass) {
    this._hass = hass;
    this.lang = this._hass.selectedLanguage || this._hass.language;
    this.weatherObj = this.config.weather in hass.states ? hass.states[this.config.weather] : null;
    this.sunObj = 'sun.sun' in hass.states ? hass.states['sun.sun'] : null;
    this.tempObj = this.config.temp in hass.states ? hass.states[this.config.temp] : null;
    this.windObj = this.config.wind in hass.states ? hass.states[this.config.wind] : null;
    this.forecast = this.weatherObj.attributes.forecast.slice(0,9);
    this.windBearing = this.weatherObj.attributes.wind_bearing;
  }

  dataChanged() {
    this.drawChart();
  }

  roundNumber(number) {
    var rounded = Math.round(number);
    return rounded;
  }

  ll(str) {
    if (locale[this.lang] === undefined)
      return locale.en[str];
    return locale[this.lang][str];
  }

  computeTime(time) {
    const date = new Date(time);
    return date.toLocaleTimeString(this.lang,
      { hour:'2-digit', minute:'2-digit' }
    );
  }

  computeWind(speed) {
    var calcSpeed = Math.round(speed * 1000 / 3600);
    return calcSpeed;
  }

  getCardSize() {
    return 4;
  }

  getUnit(unit) {
    return this._hass.config.unit_system[unit] || '';
  }

  getWeatherIcon(condition) {
    return this.weatherIcons[condition];
  }

  getWindDirIcon(degree) {
    return this.cardinalDirectionsIcon[parseInt((degree + 22.5) / 45.0)];
  }

  getWindDir(deg) {
    if (locale[this.lang] === undefined)
      return locale.en.cardinalDirections[parseInt((deg + 11.25) / 22.5)];
    return locale[this.lang]['cardinalDirections'][parseInt((deg + 11.25) / 22.5)];
  }

  drawChart() {
    if (!this.weatherObj.attributes || !this.weatherObj.attributes.forecast) {
      return [];
    }
    var data = this.weatherObj.attributes.forecast.slice(0,9);
    var locale = this._hass.selectedLanguage || this._hass.language;
    var tempUnit = this._hass.config.unit_system.temperature;
    var lengthUnit = this._hass.config.unit_system.length;
    var precipUnit = lengthUnit === 'km' ? this.ll('uPrecip') : 'in';
    var mode = this.mode;
    var i;
    var dateTime = [];
    var tempHigh = [];
    var tempLow = [];
    var precip = [];
    for (i = 0; i < data.length; i++) {
      var d = data[i];
      dateTime.push(new Date(d.datetime));
      tempHigh.push(d.temperature);
      tempLow.push(d.templow);
      precip.push(d.precipitation);
    }
    var style = getComputedStyle(document.body);
    var textColor = style.getPropertyValue('--primary-text-color');
    var dividerColor = style.getPropertyValue('--divider-color');
    const chartData = {
      labels: dateTime,
      datasets: [
        {
          label: this.ll('tempHi'),
          type: 'line',
          data: tempHigh,
          xAxisID: "xAxes",
          yAxisID: 'yTempAxis',
          borderWidth: 2.0,
          lineTension: 0.4,
          pointRadius: 0.0,
          pointHitRadius: 5.0,
          borderColor: "#ff0029",
          backgroundColor: "#ff0029",
          fill: false,
          tooltip: {
            callbacks: {
              label: function(context) {
                var label = context.dataset.label || '';
                return label += ': ' + context.parsed.y + tempUnit;
              }
            }
          }
          },
        {
          label: this.ll('tempLo'),
          type: 'line',
          data: tempLow,
          xAxisID: "xAxes",
          yAxisID: 'yTempAxis',
          borderWidth: 2.0,
          lineTension: 0.4,
          pointRadius: 0.0,
          pointHitRadius: 5.0,
          borderColor: "#66a61e",
          backgroundColor: "#66a61e",
          fill: false,
          tooltip: {
            callbacks: {
              label: function(context) {
                var label = context.dataset.label || '';
                return label += ': ' + context.parsed.y + tempUnit;
              }
            }
          }
        },
        {
          label: this.ll('precip'),
          type: 'bar',
          barThickness: 8,
          maxBarThickness: 15,
          data: precip,
          xAxisID: "xAxes",
          yAxisID: 'yPrecipAxis',
          borderColor: "#262889",
          backgroundColor: "#262889",
          tooltip: {
            callbacks: {
              label: function(context) {
                var label = context.dataset.label || '';
                return label += ': ' + context.parsed.y + precipUnit;
              }
            }
          }
        },
      ]
    }
    const chartOptions = {
        animation: {
          duration: 300,
          easing: 'linear',
          onComplete: function (animation) {
            var chartInstance = animation.chart,
              ctx = chartInstance.ctx;
            ctx.fillStyle = textColor;
            var fontSize = 10;
            var fontStyle = 'normal';
            var fontFamily = 'Roboto';
            ctx.font = fontStyle + ' ' + fontSize + 'px ' + fontFamily;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            var meta = chartInstance.getDatasetMeta(2);
            meta.data.forEach(function (bar, index) {
              var data = (Math.round((chartInstance.data.datasets[2].data[index]) * 10) / 10).toFixed(1);
              if (data > 0)
                ctx.fillText(data, bar.x, bar.y - 5);
            });
          },
        },
        legend: {
          display: false,
        },
        scales: {
          xAxes: {
            type: 'time',
            adapters: {
              date: {
                locale: this.lang,
              },
            },
            display: false,
            ticks: {
              display: false,
            },
            grid: {
              display: false,
            },
          },
          xDateAxis: {
            type: 'time',
            position: 'top',
            adapters: {
              date: {
                locale: this.lang,
              },
            },
            grid: {
              display: true,
              drawBorder: false,
              color: dividerColor,
            },
            ticks: {
              display: true,
              source: 'labels',
              autoSkip: true,
              fontColor: textColor,
              maxRotation: 0,
              callback: function(value, index, values) {
                var date = new Date(0);
                date.setUTCMilliseconds(values[index].value);
                if (mode == 'hourly') {
                  return date.toLocaleTimeString(locale, { hour: 'numeric' });
                }
                return date.toLocaleDateString(locale, { weekday: 'short' });;
              },
            },
          },
          yTempAxis: {
            position: 'left',
            adapters: {
              date: {
                locale: this.lang ,
              },
            },
            grid: {
              display: true,
              drawBorder: false,
              color: dividerColor,
              borderDash: [1,3],
            },
            ticks: {
              display: true,
              fontColor: textColor,
            },
            afterFit: function(scaleInstance) {
              scaleInstance.width = 37;
            },
          },
          yPrecipAxis: {
            display: false,
            position: 'right',
            suggestedMax: 20,
            adapters: {
              date: {
                locale: this.lang,
              },
            },
            grid: {
              display: false,
              drawBorder: false,
              color: dividerColor,
            },
            ticks: {
              display: false,
              min: 0,
              fontColor: textColor,
            },
            afterFit: function(scaleInstance) {
              scaleInstance.width = 15;
            },
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              title: function(context) {
                var date = new Date(context[0].label);
                if (mode == 'hourly') {
                  return date.toLocaleTimeString(locale, { 
                    hour: 'numeric',
                    minute: 'numeric',
                    });
                }
                return date.toLocaleDateString(locale, {
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long',
                });;
              }
            }
          }
        },
 
      }
    this.ChartData = chartData;
    this.ChartOptions = chartOptions;
  }

  _fire(type, detail, options) {
    const node = this.shadowRoot;
    options = options || {};
    detail = (detail === null || detail === undefined) ? {} : detail;
    const e = new Event(type, {
      bubbles: options.bubbles === undefined ? true : options.bubbles,
      cancelable: Boolean(options.cancelable),
      composed: options.composed === undefined ? true : options.composed
    });
    e.detail = detail;
    node.dispatchEvent(e);
    return e;
  }

  _tempAttr() {
    this._fire('hass-more-info', { entityId: this.config.temp });
  }

  _weatherAttr() {
    this._fire('hass-more-info', { entityId: this.config.weather });
  }
}

customElements.define('weather-card-chart', WeatherCardChart);
