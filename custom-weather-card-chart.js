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
        text-align: center;
      }
      .conditions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 0px -2px 0px 16px;
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
              <ha-icon icon="hass:gauge"></ha-icon> [[roundNumber(weatherObj.attributes.pressure)]] hPa
            </div>
            <div>
              <template is="dom-if" if="[[sunObj]]">
                <ha-icon icon="mdi:weather-sunset-up"></ha-icon> [[computeTime(sunObj.attributes.next_rising)]]<br>
                <ha-icon icon="mdi:weather-sunset-down"></ha-icon> [[computeTime(sunObj.attributes.next_setting)]]
              </template>
            </div>
            <div>
              <ha-icon icon="hass:[[getWindDirIcon(windBearing)]]"></ha-icon> [[getWindDir(windBearing)]]<br>
              <ha-icon icon="hass:weather-windy"></ha-icon> [[computeWind(weatherObj.attributes.wind_speed)]] m/s
            </div>
          </div>
          <ha-chart-base data="[[ChartData]]"></ha-chart-base>
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
      'partlycloudy': 'hass:weather-partlycloudy',
      'pouring': 'hass:weather-pouring',
      'rainy': 'hass:weather-rainy',
      'snowy': 'hass:weather-snowy',
      'snowy-rainy': 'hass:weather-snowy-rainy',
      'sunny': 'hass:weather-sunny',
      'windy': 'hass:weather-windy',
      'windy-variant': 'hass:weather-windy-variant'
    };
    this.cardinalDirections = [
      'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW', 'N'
    ];
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
    this.sunObj = config.sun;
    this.tempObj = config.temp;
    this.mode = config.mode;
    if (!config.weather) {
      throw new Error('Please define "weather" entity in the card config');
    }
  }

  set hass(hass) {
    this._hass = hass;
    this.weatherObj = this.config.weather in hass.states ? hass.states[this.config.weather] : null;
    this.sunObj = this.config.sun in hass.states ? hass.states[this.config.sun] : null;
    this.tempObj = this.config.temp in hass.states ? hass.states[this.config.temp] : null;
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

  computeTime(time) {
    const date = new Date(time);
    return date.toLocaleTimeString([],
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

  getWindDir(degree) {
    return this.cardinalDirections[parseInt((degree + 11.25) / 22.5)];
  }

  drawChart() {
    var dataArray = [];
    var data = this.weatherObj.attributes.forecast.slice(0,9);
    var tempUnit = this._hass.config.unit_system.temperature;
    var lengthUnit = this._hass.config.unit_system.length;
    var precipUnit = lengthUnit === 'km' ? 'mm' : 'in';
    var mode = this.mode;
    var i;
    if (!this.weatherObj.attributes.forecast) {
      return [];
    }
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
    const chartOptions = {
      type: 'bar',
      data: {
        labels: dateTime,
        datasets: [
          {
            label: 'Temperature',
            type: 'line',
            data: tempHigh,
            yAxisID: 'TempAxis',
            borderWidth: 2.0,
            lineTension: 0.4,
            pointRadius: 0.0,
            pointHitRadius: 5.0,
            fill: false,
          },
          {
            label: 'Temperature night',
            type: 'line',
            data: tempLow,
            yAxisID: 'TempAxis',
            borderWidth: 2.0,
            lineTension: 0.4,
            pointRadius: 0.0,
            pointHitRadius: 5.0,
            fill: false,
          },
          {
            label: 'Precipitations',
            type: 'bar',
            data: precip,
            yAxisID: 'PrecipAxis',
          },
        ]
      },
      options: {
        animation: {
          duration: 300,
          easing: 'linear',
          onComplete: function () {
            var chartInstance = this.chart,
              ctx = chartInstance.ctx;
            ctx.fillStyle = textColor;
            var fontSize = 10;
            var fontStyle = 'normal';
            var fontFamily = 'Roboto';
            ctx.font = Chart.helpers.fontString(fontSize, fontStyle, fontFamily);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            var meta = chartInstance.controller.getDatasetMeta(2);
            meta.data.forEach(function (bar, index) {
              var data = (Math.round((chartInstance.data.datasets[2].data[index]) * 10) / 10).toFixed(1);
              ctx.fillText(data, bar._model.x, bar._model.y - 5);
            });
          },
        },
        legend: {
          display: false,
        },
        scales: {
          xAxes: [{
            type: 'time',
            maxBarThickness: 15,
            display: false,
            ticks: {
              display: false,
            },
            gridLines: {
              display: false,
            },
          },
          {
            id: 'DateAxis',
            position: 'top',
            gridLines: {
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
                var data = new Date(value).toLocaleDateString([],
                  { weekday: 'short' });
                var time = new Date(value).toLocaleTimeString([],
                  { hour: 'numeric' });
                if (mode == 'hourly') {
                  return time;
                }
                return data;
              },
            },
          }],
          yAxes: [{
            id: 'TempAxis',
            position: 'left',
            gridLines: {
              display: true,
              drawBorder: false,
              color: dividerColor,
              borderDash: [1,3],
            },
            ticks: {
              display: true,
              fontColor: textColor,
              callback: function(value, index, values) {
                if (value > 0) {
                  return '+' + value;
                }
                return value;
              }
            },
          },
          {
            id: 'PrecipAxis',
            position: 'right',
            gridLines: {
              display: false,
              drawBorder: false,
              color: dividerColor,
            },
            ticks: {
              display: false,
              min: 0,
              suggestedMax: 20,
              fontColor: textColor,
            },
          }],
        },
        tooltips: {
          mode: 'index',
          callbacks: {
            title: function (items, data) {
              const item = items[0];
              const date = data.labels[item.index];
              return new Date(date).toLocaleDateString([], {
                month: 'long',
                day: 'numeric',
                weekday: 'long',
                hour: 'numeric',
                minute: 'numeric',
              });
            },
            label: function(tooltipItems, data) {
              var label = data.datasets[tooltipItems.datasetIndex].label || '';
              if (data.datasets[2].label == label) {
                return label + ': ' + (tooltipItems.yLabel ?
                  (tooltipItems.yLabel + ' ' + precipUnit) : ('0 ' + precipUnit));
              }
              return label + ': ' + tooltipItems.yLabel + ' ' + tempUnit;
            },
          }
        },
        layout: {
          padding: {
            top: '0.0',
            bottom: '0.0',
            right: '0.0',
            left: '-6.0',
          }
        }
      }
    };
    this.ChartData = chartOptions;
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
