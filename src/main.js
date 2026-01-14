import locale from './locale.js';
import {
  cardinalDirectionsIcon,
  weatherIcons,
  weatherIconsDay,
  weatherIconsNight,
  WeatherEntityFeature
} from './const.js';
import {LitElement, html} from 'lit';
import './weather-chart-card-editor.js';
import { property } from 'lit/decorators.js';
import {Chart, registerables} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
Chart.register(...registerables, ChartDataLabels);

class WeatherChartCard extends LitElement {

static getConfigElement() {
  return document.createElement("weather-chart-card-editor");
}

static getStubConfig(hass, unusedEntities, allEntities) {
  let entity = unusedEntities.find((eid) => eid.split(".")[0] === "weather");
  if (!entity) {
    entity = allEntities.find((eid) => eid.split(".")[0] === "weather");
  }
  return {
    entity,
    show_main: true,
    show_temperature: true,
    show_current_condition: true,
    show_attributes: true,
    show_time: false,
    show_time_seconds: false,
    show_day: false,
    show_date: false,
    show_humidity: true,
    show_pressure: true,
    show_wind_direction: true,
    show_wind_speed: true,
    show_sun: true,
    show_feels_like: false,
    show_dew_point: false,
    show_wind_gust_speed: false,
    show_visibility: false,
    show_last_changed: false,
    use_12hour_format: false,
    icons_size: 25,
    animated_icons: false,
    icon_style: 'style1',
    autoscroll: false,
    forecast: {
      precipitation_type: 'rainfall',
      show_probability: false,
      labels_font_size: '11',
      precip_bar_size: '100',
      style: 'style1',
      show_wind_forecast: true,
      condition_icons: true,
      round_temp: false,
      type: 'daily',
      number_of_forecasts: '0',
      disable_animation: false,
      show_hourly_date: true,
      show_precip_unit: true,
      show_wind_unit: true,
      override_min_column_width: '0',
    },
  };
}

  static get properties() {
    return {
      //_hass: {}, // Removed bc no need to render every time *anything* changes
      config: {},
      language: {},
      sun: {type: Object},
      weather: {type: Object},
      temperature: {type: Object},
      humidity: {type: Object},
      pressure: {type: Object},
      uv_index: {type: Object},
      windspeed: {type: Object},
      dew_point: {type: Object},
      wind_gust_speed: {type: Object},
      visibility: {type: Object},
      windDirection: {type: Number},
      feels_like: {type: Object},
      description: {type: Object},
      forecastChart: {type: Object},
      forecastItems: {type: Number},
      forecasts: { type: Array } // Note: mutating array won't update element
      //columnMinWidth: {type: Number}
    };
  }

setConfig(config) {
  const cardConfig = {
    icons_size: 25,
    animated_icons: false,
    icon_style: 'style1',
    current_temp_size: 28,
    time_size: 26,
    day_date_size: 15,
    show_feels_like: false,
    show_dew_point: false,
    show_wind_gust_speed: false,
    show_visibility: false,
    show_last_changed: false,
    show_description: false,
    ...config,
    forecast: {
      precipitation_type: 'rainfall',
      show_probability: false,
      labels_font_size: 11,
      chart_height: 180,
      precip_bar_size: 100,
      style: 'style1',
      temperature1_color: 'rgba(255, 152, 0, 1.0)',
      temperature2_color: 'rgba(68, 115, 158, 1.0)',
      precipitation_color: 'rgba(132, 209, 253, 1.0)',
      condition_icons: true,
      show_wind_forecast: true,
      round_temp: false,
      type: 'daily',
      number_of_forecasts: '0',
      '12hourformat': false,
      show_hourly_date: true,
      show_precip_unit: true,
      show_wind_unit: true,
      override_min_column_width: '0',
      ...config.forecast,
    },
    units: {
      pressure: 'hPa',
      ...config.units,
    }
  };

  cardConfig.units.speed = config.speed ? config.speed : cardConfig.units.speed;

  this.baseIconPath = cardConfig.icon_style === 'style2' ?
    'https://cdn.jsdelivr.net/gh/mlamberts78/weather-chart-card/dist/icons2/':
    'https://cdn.jsdelivr.net/gh/mlamberts78/weather-chart-card/dist/icons/' ;

  // Find minimum column width if not manually set.
  if (cardConfig.forecast.override_min_column_width > 0) {
    this.columnMinWidth = cardConfig.forecast.override_min_column_width;
  } else {
    let fontSize = cardConfig.forecast.labels_font_size;

    let minWidthForIconAndWind;
    if (cardConfig.forecast.show_wind_forecast && cardConfig.forecast.show_wind_unit) {
      minWidthForIconAndWind = 48;
    } else {
      minWidthForIconAndWind = 26;
    }

    let minWidthForChartLabels;
    if (cardConfig.forecast.show_precip_unit) {
      minWidthForChartLabels = fontSize * 5;
    } else {
      minWidthForChartLabels = fontSize * 3.5;
    }

    if (cardConfig.forecast.type === 'hourly' && cardConfig.forecast.show_hourly_date) {
      // Use a wider column width to help ensure date can always fit.
      // 70 seems to be enough for most locales, hopefully. Not really a
      // one-size-fits-all thing though, because increasing this too much will
      // negatively impact users who don't need it.
      // Users who notice and care can always manually set their own minimum.
      this.columnMinWidth = Math.max(70, minWidthForChartLabels, minWidthForIconAndWind);
    } else {
      this.columnMinWidth = Math.max(minWidthForChartLabels, minWidthForIconAndWind);
    }
  }

  this.config = cardConfig;

  if (!config.entity) {
    throw new Error('Please, define entity in the card config');
  }
}

set hass(hass) {
  this._hass = hass;
  this.language = this.config.locale || hass.selectedLanguage || hass.language;
  this.sun = 'sun.sun' in hass.states ? hass.states['sun.sun'] : null;

  this.weather = this.config.entity in hass.states
    ? hass.states[this.config.entity]
    : null;

  this.unitSpeed = this.config.units.speed ? this.config.units.speed : this.weather && this.weather.attributes.wind_speed_unit;
  this.unitPressure = this.config.units.pressure ? this.config.units.pressure : this.weather && this.weather.attributes.pressure_unit;
  // this.unitVisibility = this.config.units.visibility ? this.config.units.visibility : this.weather && this.weather.attributes.visibility_unit; // (unused)

  if (this.weather) {
    if (this.config.temp) {
      this.temperature = hass.states[this.config.temp].state;
      this.temperature_unit = this.config.temp_unit ? this.config.temp_unit : this.weather.attributes.temperature_unit;
    } else {
      this.temperature = this.weather.attributes.temperature;
      this.temperature_unit = this.weather.attributes.temperature_unit;
    }

    if (this.config.feels_like) {
      this.feels_like = hass.states[this.config.feels_like].state;
      this.feels_like_unit = this.config.feels_like_unit ? this.config.feels_like_unit : this.weather.attributes.temperature_unit;
    } else {
      this.feels_like = this.weather.attributes.apparent_temperature;
      this.feels_like_unit = this.weather.attributes.temperature_unit;
    }

    if (this.config.dew_point) {
      this.dew_point = hass.states[this.config.dew_point].state;
      this.dew_point_unit = this.config.dew_point_unit ? this.config.dew_point_unit : this.weather.attributes.temperature_unit;
    } else {
      this.dew_point = this.weather.attributes.dew_point;
      this.dew_point_unit = this.weather.attributes.temperature_unit;
    }

    if (this.config.press) {
      this.pressure = hass.states[this.config.press].state;
      this.pressure_unit = this.config.press_unit ? this.config.press_unit : this.weather.attributes.pressure_unit;
    } else {
      this.pressure = this.weather.attributes.pressure;
      this.pressure_unit = this.weather.attributes.pressure_unit;
    }

    if (this.config.windspeed) {
      this.windspeed = hass.states[this.config.windspeed].state;
      this.windspeed_unit = this.config.windspeed_unit ? this.config.windspeed_unit : this.weather.attributes.wind_speed_unit;
    } else {
      this.windspeed = this.weather.attributes.wind_speed;
      this.windspeed_unit = this.weather.attributes.wind_speed_unit;
    }

    if (this.config.wind_gust_speed) {
      this.wind_gust_speed = hass.states[this.config.wind_gust_speed].state;
      this.wind_gust_speed_unit = this.config.wind_gust_speed_unit ? this.config.wind_gust_speed_unit : this.weather.attributes.wind_speed_unit;
    } else {
      this.wind_gust_speed = this.weather.attributes.wind_gust_speed;
      this.wind_gust_speed_unit = this.weather.attributes.wind_speed_unit;
    }

    if (this.config.visibility_entity) {
      this.visibility = hass.states[this.config.visibility_entity].state;
      this.visibility_unit = this.config.visibility_unit ? this.config.visibility_unit : this.weather.attributes.visibility_unit;
    } else if (this.config.visibility && hass.states[this.config.visibility]) { // keep compatibility with old config
      this.visibility = hass.states[this.config.visibility].state;
      this.visibility_unit = this.config.visibility_unit ? this.config.visibility_unit : this.weather.attributes.visibility_unit;
    } else {
      this.visibility = this.weather.attributes.visibility;
      this.visibility_unit = this.weather.attributes.visibility_unit;
    }

    this.humidity = this.config.humid ? hass.states[this.config.humid].state : this.weather.attributes.humidity;
    this.uv_index = this.config.uv ? hass.states[this.config.uv].state : this.weather.attributes.uv_index;

    if (this.config.winddir && hass.states[this.config.winddir] && hass.states[this.config.winddir].state !== undefined) {
      this.windDirection = parseFloat(hass.states[this.config.winddir].state);
    } else {
      this.windDirection = this.weather.attributes.wind_bearing;
    }

    this.description = this.config.description && hass.states[this.config.description] ? hass.states[this.config.description].state : this.weather.attributes.description;
  }

  if (this.weather && !this.forecastSubscriber) {
    this.subscribeForecastEvents();
  }
}

subscribeForecastEvents() {
  const forecastType = this.config.forecast.type || 'daily';
  const isHourly = forecastType === 'hourly';

  const feature = isHourly ? WeatherEntityFeature.FORECAST_HOURLY : WeatherEntityFeature.FORECAST_DAILY;
  if (!this.supportsFeature(feature)) {
    console.error(`Weather entity "${this.config.entity}" does not support ${isHourly ? 'hourly' : 'daily'} forecasts.`);
    return;
  }

  const callback = (event) => {
    this.forecasts = event.forecast;
  };

  this.forecastSubscriber = this._hass.connection.subscribeMessage(callback, {
    type: "weather/subscribe_forecast",
    forecast_type: isHourly ? 'hourly' : 'daily',
    entity_id: this.config.entity,
  });
}

  supportsFeature(feature) {
    return (this.weather.attributes.supported_features & feature) !== 0;
  }

  constructor() {
    super();
    this.resizeObserver = null;
    this.resizeInitialized = false;
  }

  connectedCallback() {
    super.connectedCallback();
    if (!this.resizeInitialized) {
      this.delayedAttachResizeObserver();
    }
  }

  delayedAttachResizeObserver() {
    setTimeout(() => {
      this.attachResizeObserver();
      this.resizeInitialized = true;
    }, 0);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.detachResizeObserver();
    if (this.forecastSubscriber) {
      this.forecastSubscriber.then((unsub) => unsub());
    }
    if (this._updateClockInterval !== undefined) {
      clearInterval(this._updateClockInterval);
      this._updateClockInterval = undefined;
    }
    this.cancelAutoscroll();
  }

  attachResizeObserver() {
    this.resizeObserver = new ResizeObserver(() => {
      this.measureCard();
      // Presumably drawChart ensures the chart is re-created matching the new
      // canvas size??
      this.drawChart();
    });
    const card = this.shadowRoot.querySelector('ha-card');
    if (card) {
      this.resizeObserver.observe(card);
    }
  }

  detachResizeObserver() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

measureCard() {
  const card = this.shadowRoot.querySelector('ha-card .card');
  const numberOfForecasts = this.config.forecast.number_of_forecasts || 0;

  if (!card) {
    return;
  }

  const cardStyle = window.getComputedStyle(card);
  const cardWidth = card.offsetWidth - parseFloat(cardStyle.paddingLeft) - parseFloat(cardStyle.paddingRight);
  // I forget where the magic "- 10" on cardWidth came from -- probably margin on .conditions or .wind-details
  this.forecastItems = numberOfForecasts > 0 ? numberOfForecasts : Math.floor((cardWidth - 10) / this.columnMinWidth);
}

ll(str) {
  const selectedLocale = this.config.locale || this.language || 'en';

  if (locale[selectedLocale] === undefined) {
    return locale.en[str];
  }

  return locale[selectedLocale][str];
}

  getCardSize() {
    return 4;
  }

  getWeatherIcon(condition, sun) {
    if (this.config.animated_icons === true) {
      const iconName = sun === 'below_horizon' ? weatherIconsNight[condition] : weatherIconsDay[condition];
      return `${this.baseIconPath}${iconName}.svg`;
    } else if (this.config.icons) {
      const iconName = sun === 'below_horizon' ? weatherIconsNight[condition] : weatherIconsDay[condition];
      return `${this.config.icons}${iconName}.svg`;
    }
    return weatherIcons[condition];
  }

getWindDirIcon(deg) {
  if (typeof deg === 'number') {
    return cardinalDirectionsIcon[parseInt((deg + 22.5) / 45.0)];
  } else {
    var i = 9;
    switch (deg) {
      case "N":
        i = 0;
        break;
      case "NNE":
      case "NE":
        i = 1;
        break;
      case "ENE":
      case "E":
        i = 2;
        break;
      case "ESE":
      case "SE":
        i = 3;
        break;
      case "SSE":
      case "S":
        i = 4;
        break;
      case "SSW":
      case "SW":
        i = 5;
        break;
      case "WSW":
      case "W":
        i = 6;
        break;
      case "WNW":
      case "NW":
        i = 7;
        break;
      case "NNW":
        i = 8;
        break;
      default:
        i = 9;
        break;
    }
    return cardinalDirectionsIcon[i];
  }
}

getWindDir(deg) {
  if (typeof deg === 'number') {
    return this.ll('cardinalDirections')[parseInt((deg + 11.25) / 22.5)];
  } else {
    return deg;
  }
}

convertSpeed(speed, unitFrom, unitTo) {
  if (unitFrom === unitTo) {
    return speed;
  }

  // Multiply speed by conversion factor to convert to m/s.
  // Divide speed by conversion factor to convert from m/s.
  const convFactor = {
    'm/s': 1,
    'km/h': 0.277778,
    'ft/s': 0.3048,
    'mph': 0.44704,
    'kn': 0.514444,
  };

  // Special case: Beaufort scale
  if (unitTo === 'Bft' || unitTo === 'Beaufort') {
    // Convert to m/s.
    speed = speed * convFactor[unitFrom];
    // Convert m/s to Beaufort.
    // Matches Home Assistant built-in Beaufort unit: https://github.com/home-assistant/core/pull/105795
    return Math.pow(speed / 0.836, 2 / 3);
  }
  if (unitFrom === 'Bft' || unitFrom === 'Beaufort') {
    // Convert to m/s.
    // Matches Home Assistant built-in Beaufort unit: https://github.com/home-assistant/core/pull/105795
    speed = 0.836 * Math.pow(speed, 3 / 2);
    // Convert from m/s to desired unit.
    return speed / convFactor[unitTo];
  }

  // Convert to m/s and back to get speed in desired unit.
  return speed * convFactor[unitFrom] / convFactor[unitTo];
}

convertPressure(pressure, unitFrom, unitTo) {
  if (unitFrom === unitTo) {
    return pressure;
  }

  // Multiply pressure by conversion factor to convert to hPa.
  // Divide pressure by conversion factor to convert from hPa.
  // (Not sure all of these really make sense to use, but they're all valid for
  // atmospheric pressure in different areas)
  const convFactor = {
    'hPa': 1,
    'kPa': 10,
    'Pa': 0.01,
    'mPa': 0.00001,
    'bar': 1000,
    'cbar': 10,
    'mbar': 1,
    'mmHg': 1.33322,
    'inHg': 33.8639,
  };

  // Convert to hPa and back to get pressure in desired unit.
  return pressure * convFactor[unitFrom] / convFactor[unitTo];
}

async firstUpdated(changedProperties) {
  super.firstUpdated(changedProperties);
  this.measureCard();
  this.drawChart();

  if (this.config.autoscroll) {
    this.autoscroll();
  }

  if (this.config.show_time) {
    this._updateClock();
    if (this._updateClockInterval === undefined) {
      this._updateClockInterval = setInterval(this._updateClock.bind(this), 1000);
    }
  }
}


async update(changedProperties) {
  // Apply autoscroll here to ensure it gets the same results everywhere.
  if (this.config.autoscroll) {
    const cutoff = new Date() - ((this.config.forecast.type === 'hourly' ? 1 : 24) * 60 * 60 * 1000);
    function isTooOld(forecast) {
      return new Date(forecast.datetime) <= cutoff;
    }

    // Only do anything if forecasts exist and the first forecast is too old.
    if (this.forecasts && this.forecasts.length && isTooOld(this.forecasts[0])) {
      // changedProperties is expected to contain the old value, before any
      // changes.
      // If forecasts is already present there, we have nothing to preserve and
      // can freely modify the current array in this.forecasts.
      // Otherwise, set the 'forecasts' key, then create a copy to work on (so
      // we don't modify the original array that we're trying to keep).
      if (!changedProperties.has('forecasts')) {
        changedProperties.set('forecasts', this.forecasts);
        this.forecasts = this.forecasts.slice();
      }

      // Remove all forecasts that are too old from start of array.
      while (this.forecasts.length && isTooOld(this.forecasts[0])) {
        this.forecasts.shift();
      }
    }
  }

  super.update(changedProperties);
}

async updated(changedProperties) {
  // await this.updateComplete;

  if (changedProperties.has('config')) {
    const oldConfig = changedProperties.get('config');

    const entityChanged = oldConfig && this.config.entity !== oldConfig.entity;
    const forecastTypeChanged = oldConfig && this.config.forecast.type !== oldConfig.forecast.type;
    const autoscrollChanged = oldConfig && this.config.autoscroll !== oldConfig.autoscroll;
    const showTimeChanged = oldConfig && this.config.show_time !== oldConfig.show_time;

    if (entityChanged || forecastTypeChanged) {
      if (this.forecastSubscriber && typeof this.forecastSubscriber === 'function') {
        this.forecastSubscriber();
      }

      this.subscribeForecastEvents();
    }

    // Config change may affect chart presentation, so redraw from scratch
    this.drawChart();

    if (autoscrollChanged) {
      if (!this.config.autoscroll) {
        this.autoscroll();
      } else {
        this.cancelAutoscroll();
      }
    }

    if (showTimeChanged) {
      if (this.config.show_time) {
        this._updateClock();
        if (this._updateClockInterval === undefined) {
          this._updateClockInterval = setInterval(this._updateClock.bind(this), 1000);
        }
      } else {
        if (this._updateClockInterval !== undefined) {
          clearInterval(this._updateClockInterval);
          this._updateClockInterval = undefined;
        }
      }
    }
  }

  if (changedProperties.has('forecasts')) {
    this.updateChart();
  }
}

autoscroll() {
  if (this.autoscrollTimeout) {
    // Autscroll already set, nothing to do
    return;
  }

  const updateChartOncePerHour = () => {
    const now = new Date();
    const nextHour = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        now.getHours()+1,
    );
    this.autoscrollTimeout = setTimeout(() => {
      this.autoscrollTimeout = null;
      this.requestUpdate();
    }, nextHour - now);
  };

  updateChartOncePerHour();
}

cancelAutoscroll() {
  if (this.autoscrollTimeout) {
    clearTimeout(this.autoscrollTimeout);
  }
}

/**
* Completely recreates the main chart (not anything else).
*/
drawChart({ config, language, weather, forecastItems } = this) {
  if (!this.forecasts || !this.forecasts.length || !weather) {
    return [];
  }

  // set min-width to force scrolling if too many columns
  const chartContainer = this.shadowRoot && this.shadowRoot.querySelector('div.chart-container');
  if (!chartContainer) {
      return
  }
  const totalMinWidth = Math.min(this.forecastItems, this.forecasts.length) * this.columnMinWidth;
  chartContainer.style['min-width'] = totalMinWidth + 'px';

  const chartCanvas = this.renderRoot && this.renderRoot.querySelector('#forecastChart');
  if (!chartCanvas) {
    console.error('Canvas element not found:', this.renderRoot);
    return;
  }

  if (this.forecastChart) {
    this.forecastChart.destroy();
  }

  // Note: use weather attributes because forecast is always from weather, not
  // a custom sensor entity.
  var tempUnit = weather.attributes.temperature_unit;
  if (config.forecast.precipitation_type !== 'rainfall') {
    var precipUnit = '%';
  } else {
    var precipUnitRaw = weather.attributes.precipitation_unit;
    var precipUnit = this.ll('units')[precipUnitRaw];
  }
  const data = this.computeForecastData();

  var style = getComputedStyle(document.body);
  var backgroundColor = style.getPropertyValue('--card-background-color');
  var textColor = style.getPropertyValue('--primary-text-color');
  var dividerColor = style.getPropertyValue('--divider-color');
  const canvas = this.renderRoot.querySelector('#forecastChart');
  if (!canvas) {
    requestAnimationFrame(() => this.drawChart());
    return;
  }

  const ctx = canvas.getContext('2d');

  let precipMax;

  if (config.forecast.precipitation_type !== 'rainfall') {
    precipMax = 100;
  } else {
    if (config.forecast.type === 'hourly') {
      precipMax = precipUnitRaw === 'mm' ? 4 : precipUnitRaw === 'cm' ? 0.4 : 0.2;
    } else {
      precipMax = precipUnitRaw === 'mm' ? 20 : precipUnitRaw === 'cm' ? 2 : 1;
    }
  }

  Chart.defaults.color = textColor;
  Chart.defaults.scale.grid.color = dividerColor;
  Chart.defaults.elements.line.fill = false;
  Chart.defaults.elements.line.tension = 0.3;
  Chart.defaults.elements.line.borderWidth = 1.5;
  Chart.defaults.elements.point.radius = 2;
  Chart.defaults.elements.point.hitRadius = 10;

  var datasets = [
    {
      label: this.ll('tempHi'),
      type: 'line',
      data: data.tempHigh,
      yAxisID: 'TempAxis',
      borderColor: config.forecast.temperature1_color,
      backgroundColor: config.forecast.temperature1_color,
    },
    {
      label: this.ll('tempLo'),
      type: 'line',
      data: data.tempLow,
      yAxisID: 'TempAxis',
      borderColor: config.forecast.temperature2_color,
      backgroundColor: config.forecast.temperature2_color,
    },
    {
      label: this.ll('precip'),
      type: 'bar',
      data: data.precip,
      yAxisID: 'PrecipAxis',
      borderColor: config.forecast.precipitation_color,
      backgroundColor: config.forecast.precipitation_color,
      barPercentage: config.forecast.precip_bar_size / 100,
      categoryPercentage: 1.0,
      datalabels: {
        display: function (context) {
          return context.dataset.data[context.dataIndex] > 0 ? 'true' : false;
        },
      formatter: function (value, context) {
        const rainfall = context.dataset.data[context.dataIndex];
        const probability = data.forecast[context.dataIndex].precipitation_probability;

        let formattedValue;
        if (config.forecast.precipitation_type === 'rainfall') {
          let unit = config.forecast.show_precip_unit ? ' ' + precipUnit : '';
          if (probability !== undefined && probability !== null && config.forecast.show_probability) {
            formattedValue = `${rainfall > 9 ? Math.round(rainfall) : rainfall.toFixed(1)}${unit}\n${Math.round(probability)}%`;
          } else {
            formattedValue = `${rainfall > 9 ? Math.round(rainfall) : rainfall.toFixed(1)}${unit}`;
          }
        } else {
          formattedValue = `${rainfall > 9 ? Math.round(rainfall) : rainfall.toFixed(1)}%`;
        }

        formattedValue = formattedValue.replace('\n', '\n\n');

        return formattedValue;
      },
        textAlign: 'center',
        textBaseline: 'middle',
        align: 'top',
        anchor: 'start',
        offset: -10,
      },
    },
  ];

  const chart_text_color = (config.forecast.chart_text_color === 'auto') ? textColor : config.forecast.chart_text_color;

  if (config.forecast.style === 'style2') {
    datasets[0].datalabels = {
      display: function (context) {
        return 'true';
      },
      formatter: function (value, context) {
        return context.dataset.data[context.dataIndex] + '°';
      },
      align: 'top',
      anchor: 'center',
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      color: chart_text_color || config.forecast.temperature1_color,
      font: {
        size: parseInt(config.forecast.labels_font_size) + 1,
        lineHeight: 0.7,
      },
    };

    datasets[1].datalabels = {
      display: function (context) {
        return 'true';
      },
      formatter: function (value, context) {
        return context.dataset.data[context.dataIndex] + '°';
      },
      align: 'bottom',
      anchor: 'center',
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      color: chart_text_color || config.forecast.temperature2_color,
      font: {
        size: parseInt(config.forecast.labels_font_size) + 1,
        lineHeight: 0.7,
      },
    };
  }

  this.forecastChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.dateTime,
      datasets: datasets,
    },
    options: {
      maintainAspectRatio: false,
      animation: config.forecast.disable_animation === true ? { duration: 0 } : {},
      layout: {
        padding: {
          bottom: 10,
        },
      },
      scales: {
        x: {
          position: 'top',
          border: {
            width: 0,
          },
          grid: {
            drawTicks: false,
            color: dividerColor,
          },
          ticks: {
              maxRotation: 0,
              color: config.forecast.chart_datetime_color || textColor,
              padding: config.forecast.precipitation_type === 'rainfall' && config.forecast.show_probability && config.forecast.type !== 'hourly' ? 4 : 10,
              callback: function (value, index, values) {
                  var datetime = this.getLabelForValue(value);
                  var dateObj = new Date(datetime);

                  if (config.forecast.type !== 'hourly') {
                      var weekday = dateObj.toLocaleString(language, { weekday: 'short' }).toUpperCase();
                      return weekday;
                  }

                  var timeFormatOptions = {
                      hour12: config.use_12hour_format,
                      hour: 'numeric',
                      ...(config.use_12hour_format ? {} : { minute: 'numeric' }),
                  };

                  var time = dateObj.toLocaleTimeString(language, timeFormatOptions);
                  time = time.replace('a.m.', 'AM').replace('p.m.', 'PM');

                  if (config.forecast.show_hourly_date && dateObj.getHours() === 0 && dateObj.getMinutes() === 0) {
                      var dateFormatOptions = {
                          day: 'numeric',
                          month: 'short',
                      };
                      var date = dateObj.toLocaleDateString(language, dateFormatOptions);
                      return [date, time];
                  }

                  return time;
              },
          },
          reverse: document.dir === 'rtl' ? true : false,
        },
        TempAxis: {
          position: 'left',
          beginAtZero: false,
          suggestedMin: Math.min(...data.tempHigh, ...data.tempLow) - 5,
          suggestedMax: Math.max(...data.tempHigh, ...data.tempLow) + 3,
          grid: {
            display: false,
            drawTicks: false,
          },
          ticks: {
            display: false,
          },
        },
        PrecipAxis: {
          position: 'right',
          suggestedMax: precipMax,
          grid: {
            display: false,
            drawTicks: false,
          },
          ticks: {
            display: false,
          },
        },
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
          padding: config.forecast.precipitation_type === 'rainfall' && config.forecast.show_probability && config.forecast.type !== 'hourly' ? 3 : 4,
          color: chart_text_color || textColor,
          font: {
            size: config.forecast.labels_font_size,
            lineHeight: 0.7,
          },
          formatter: function (value, context) {
            return context.dataset.data[context.dataIndex] + '°';
          },
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
                hour12: config.use_12hour_format,
              });
            },
    label: function (context) {
      var label = context.dataset.label;
      var value = context.formattedValue;
      var probability = data.forecast[context.dataIndex].precipitation_probability;
      var unit = context.datasetIndex === 2 ? precipUnit : tempUnit;

      if (context.datasetIndex === 2 && config.forecast.precipitation_type === 'rainfall' && config.forecast.show_probability && probability !== undefined && probability !== null) {
        return label + ': ' + value + ' ' + precipUnit + ' / ' + Math.round(probability) + '%';
      } else if (context.datasetIndex === 2 && config.forecast.precipitation_type !== 'rainfall') {
        return label + ': ' + value + '%';
      } else {
        return label + ': ' + value + ' ' + unit;
      }
            },
          },
        },
      },
    },
  });
}

computeForecastData({ config, forecastItems } = this) {
  var forecast = this.forecasts ? this.forecasts.slice(0, forecastItems) : [];
  var roundTemp = config.forecast.round_temp == true;
  var dateTime = [];
  var tempHigh = [];
  var tempLow = [];
  var precip = [];

  for (var i = 0; i < forecast.length; i++) {
    var d = forecast[i];
    dateTime.push(d.datetime);
    tempHigh.push(d.temperature);
    if (typeof d.templow !== 'undefined') {
      tempLow.push(d.templow);
    }

    if (roundTemp) {
      tempHigh[i] = Math.round(tempHigh[i]);
      if (typeof d.templow !== 'undefined') {
        tempLow[i] = Math.round(tempLow[i]);
      }
    }
    if (config.forecast.precipitation_type === 'probability') {
      precip.push(d.precipitation_probability);
    } else {
      precip.push(d.precipitation);
    }
  }

  return {
    forecast,
    dateTime,
    tempHigh,
    tempLow,
    precip,
  }
}

/**
* Updates the data of the main chart (not anything else).
*/
updateChart({ forecasts, forecastChart } = this) {
  if (!forecasts || !forecasts.length) {
    return [];
  }

  const data = this.computeForecastData();

  if (forecastChart) {
    forecastChart.data.labels = data.dateTime;
    forecastChart.data.datasets[0].data = data.tempHigh;
    forecastChart.data.datasets[1].data = data.tempLow;
    forecastChart.data.datasets[2].data = data.precip;
    forecastChart.update();
  }
}

  render({config, _hass, weather} = this) {
    if (!config || !_hass) {
      return html``;
    }
    if (!weather || !weather.attributes) {
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
          padding-bottom: ${config.show_last_changed === true ? '2px' : '16px'};
          padding-left: 16px;
        }
        .main {
          display: flex;
          align-items: center;
          font-size: ${config.current_temp_size}px;
          margin-bottom: 10px;
        }
        .main ha-icon {
          --mdc-icon-size: 50px;
          margin-right: 14px;
          margin-inline-start: initial;
          margin-inline-end: 14px;
        }
        .main img {
          width: ${config.icons_size * 2}px;
          height: ${config.icons_size * 2}px;
          margin-right: 14px;
          margin-inline-start: initial;
          margin-inline-end: 14px;
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
          direction: ltr;
        }
        .scroll-content {
            overflow-x: auto;
            scrollbar-width: thin;
        }
        .chart-container {
          position: relative;
          height: ${config.forecast.chart_height}px;
          width: 100%;
          direction: ltr;
        }
        .conditions {
          display: flex;
          justify-content: space-around;
          align-items: center;
          margin: 0px 5px 5px 5px;
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
          align-items: center;
          font-weight: 300;
          margin: -5px 5px 0px 5px;
        }
        .wind-detail {
          display: block;
          width: 46px; /*note: slightly smaller than 48px in columnMinWidth to allow room for margin*/
          margin: 3px 1px 1px;
        }
        .wind-detail ha-icon {
          --mdc-icon-size: 15px;
        }
        .wind-icon {
          display: block;
          width: fit-content;
          margin: 0 auto;
          line-height: 1;
        }
        .wind-speed-wrap {
          width: 100%;
          margin: 0 auto;
          text-align: center;
          line-height: 1;
        }
        .wind-speed {
          font-size: 11px;
          margin-right: 1px;
          margin-inline-start: initial;
          margin-inline-end: 1px;
        }
        .wind-unit {
          display: inline-block;
          font-size: 9px;
          margin-left: 1px;
          margin-inline-start: 1px;
          margin-inline-end: initial;
        }
        .current-time {
          position: absolute;
          top: 20px;
          right: 16px;
          inset-inline-start: initial;
          inset-inline-end: 16px;
          font-size: ${config.time_size}px;
        }
        .date-text {
          font-size: ${config.day_date_size}px;
          color: var(--secondary-text-color);
        }
        .main .feels-like {
          font-size: 13px;
          margin-top: 5px;
          font-weight: 400;
        }
        .main .description {
	  font-style: italic;
          font-size: 13px;
          margin-top: 5px;
          font-weight: 400;
        }
        .updated {
          font-size: 13px;
          align-items: right;
          font-weight: 300;
          margin-bottom: 1px;
        }
      </style>

      <ha-card header="${config.title}">
        <div class="card">
          ${this.renderMain()}
          ${this.renderAttributes()}
          <div class="scroll-content">
            <div class="chart-container">
              <canvas id="forecastChart"></canvas>
            </div>
            ${this.renderForecastConditionIcons()}
            ${this.renderWind()}
          </div>
          ${this.renderLastUpdated()}
        </div>
      </ha-card>
    `;
  }

_updateClock({ config } = this) {
  const currentDate = new Date();
  const timeOptions = {
    hour12: config.use_12hour_format,
    hour: 'numeric',
    minute: 'numeric',
    second: config.show_time_seconds ? 'numeric' : undefined
  };
  const currentTime = currentDate.toLocaleTimeString(this.language, timeOptions);
  const currentDayOfWeek = currentDate.toLocaleString(this.language, { weekday: 'long' }).toUpperCase();
  const currentDateFormatted = currentDate.toLocaleDateString(this.language, { month: 'long', day: 'numeric' });

  const mainDiv = this.shadowRoot.querySelector('.main');
  if (mainDiv) {
    const clockElement = mainDiv.querySelector('#digital-clock');
    if (clockElement) {
      clockElement.textContent = currentTime;
    }
    if (config.show_day) {
      const dayElement = mainDiv.querySelector('.date-text.day');
      if (dayElement) {
        dayElement.textContent = currentDayOfWeek;
      }
    }
    if (config.show_date) {
      const dateElement = mainDiv.querySelector('.date-text.date');
      if (dateElement) {
        dateElement.textContent = currentDateFormatted;
      }
    }
  }
}

renderMain({ config, sun, weather, temperature, temperature_unit, feels_like, feels_like_unit, description } = this) {
  if (config.show_main === false)
    return html``;

  const showTime = config.show_time;
  const showDay = config.show_day;
  const showDate = config.show_date;
  const showFeelsLike = config.show_feels_like;
  const showDescription = config.show_description;
  const showCurrentCondition = config.show_current_condition !== false;
  const showTemperature = config.show_temperature !== false;

  let roundedTemperature = parseFloat(temperature);
  if (!isNaN(roundedTemperature) && roundedTemperature % 1 !== 0) {
    roundedTemperature = Math.round(roundedTemperature * 10) / 10;
  }

  let roundedFeelsLike = parseFloat(feels_like);
  if (!isNaN(roundedFeelsLike) && roundedFeelsLike % 1 !== 0) {
    roundedFeelsLike = Math.round(roundedFeelsLike * 10) / 10;
  }

  const iconHtml = config.animated_icons || config.icons
    ? html`<img src="${this.getWeatherIcon(weather.state, sun.state)}" alt="">`
    : html`<ha-icon icon="${this.getWeatherIcon(weather.state, sun.state)}"></ha-icon>`;

  return html`
    <div class="main">
      ${iconHtml}
      <div>
        <div>
          ${showTemperature ? html`${roundedTemperature}<span>${temperature_unit}</span>` : ''}
          ${showFeelsLike && !isNaN(roundedFeelsLike) ? html`
            <div class="feels-like">
              ${this.ll('feelsLike')}
              ${roundedFeelsLike}${feels_like_unit}
            </div>
          ` : ''}
          ${showCurrentCondition ? html`
            <div class="current-condition">
              <span>${this.ll(weather.state)}</span>
            </div>
          ` : ''}
          ${showDescription ? html`
            <div class="description">
              ${description}
            </div>
          ` : ''}
        </div>
        ${showTime ? html`
          <div class="current-time">
            <div id="digital-clock"></div>
            ${showDay ? html`<div class="date-text day"></div>` : ''}
            ${showDay && showDate ? html` ` : ''}
            ${showDate ? html`<div class="date-text date"></div>` : ''}
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

renderAttributes({ config, humidity, pressure, pressure_unit, windspeed, windspeed_unit, windDirection,
  sun, language, uv_index, dew_point, wind_gust_speed, wind_gust_speed_unit, visibility } = this
) {
  if (config.show_attributes == false)
    return html``;

  const showHumidity = config.show_humidity !== false;
  const showPressure = config.show_pressure !== false;
  const showWindDirection = config.show_wind_direction !== false;
  const showWindSpeed = config.show_wind_speed !== false;
  const showSun = config.show_sun !== false;
  const showDewpoint = config.show_dew_point == true;
  const showWindgustspeed = config.show_wind_gust_speed == true;
  const showVisibility = config.show_visibility == true;

  let dWindSpeed = windspeed;
  let dWindGustSpeed = wind_gust_speed;
  let dPressure = pressure;

  if (showWindSpeed && dWindSpeed !== undefined) {
    dWindSpeed = this.convertSpeed(dWindSpeed, windspeed_unit, this.unitSpeed);
    dWindSpeed = Math.round(dWindSpeed);
  }

  if (showWindgustspeed && dWindGustSpeed !== undefined) {
    dWindGustSpeed = this.convertSpeed(dWindGustSpeed, wind_gust_speed_unit, this.unitSpeed);
    dWindGustSpeed = Math.round(dWindGustSpeed);
  }

  if (showPressure && dPressure !== undefined) {
    dPressure = this.convertPressure(dPressure, pressure_unit, this.unitPressure);
    if (this.unitPressure === 'cbar' || this.unitPressure === 'kPa') {
      dPressure = dPressure.toFixed(1);
    } else if (this.unitPressure === 'inHg') {
      dPressure = dPressure.toFixed(2);
    } else if (this.unitPressure === 'bar') {
      dPressure = dPressure.toFixed(3);
    } else {
      dPressure = Math.round(dPressure);
    }
  }

return html`
    <div class="attributes">
      ${((showHumidity && humidity !== undefined) || (showPressure && dPressure !== undefined) || (showDewpoint && dew_point !== undefined) || (showVisibility && visibility !== undefined)) ? html`
        <div>
          ${showHumidity && humidity !== undefined ? html`
            <ha-icon icon="hass:water-percent"></ha-icon> ${humidity} %<br>
          ` : ''}
          ${showPressure && dPressure !== undefined ? html`
            <ha-icon icon="hass:gauge"></ha-icon> ${dPressure} ${this.ll('units')[this.unitPressure]} <br>
          ` : ''}
          ${showDewpoint && dew_point !== undefined ? html`
            <ha-icon icon="hass:thermometer-water"></ha-icon> ${dew_point} ${this.dew_point_unit} <br>
          ` : ''}
          ${showVisibility && visibility !== undefined ? html`
            <ha-icon icon="hass:eye"></ha-icon> ${visibility} ${this.visibility_unit}
          ` : ''}
        </div>
      ` : ''}
      ${((showSun && sun !== undefined) || (typeof uv_index !== 'undefined' && uv_index !== undefined)) ? html`
        <div>
          ${typeof uv_index !== 'undefined' && uv_index !== undefined ? html`
            <div>
              <ha-icon icon="hass:white-balance-sunny"></ha-icon> UV: ${Math.round(uv_index * 10) / 10}
            </div>
          ` : ''}
          ${showSun && sun !== undefined ? html`
            <div>
              ${this.renderSun({ sun, language })}
            </div>
          ` : ''}
        </div>
      ` : ''}
      ${((showWindDirection && windDirection !== undefined) || (showWindSpeed && dWindSpeed !== undefined) || (showWindgustspeed && dWindGustSpeed !== undefined)) ? html`
        <div>
          ${showWindDirection && windDirection !== undefined ? html`
            <ha-icon icon="hass:${this.getWindDirIcon(windDirection)}"></ha-icon> ${this.getWindDir(windDirection)} <br>
          ` : ''}
          ${showWindSpeed && dWindSpeed !== undefined ? html`
            <ha-icon icon="hass:weather-windy"></ha-icon>
            ${dWindSpeed} ${this.ll('units')[this.unitSpeed]} <br>
          ` : ''}
          ${showWindgustspeed && dWindGustSpeed !== undefined ? html`
            <ha-icon icon="hass:weather-windy-variant"></ha-icon>
            ${dWindGustSpeed} ${this.ll('units')[this.unitSpeed]}
          ` : ''}
        </div>
      ` : ''}
    </div>
`;
}

renderSun({ sun, language, config } = this) {
  if (sun == undefined) {
    return html``;
  }

  const use12HourFormat = this.config.use_12hour_format;
  const timeOptions = {
      hour12: use12HourFormat,
      hour: 'numeric',
      minute: 'numeric'
  };

  return html`
    <ha-icon icon="mdi:weather-sunset-up"></ha-icon>
      ${new Date(sun.attributes.next_rising).toLocaleTimeString(language, timeOptions)}<br>
    <ha-icon icon="mdi:weather-sunset-down"></ha-icon>
      ${new Date(sun.attributes.next_setting).toLocaleTimeString(language, timeOptions)}
  `;
}

renderForecastConditionIcons({ config, forecastItems, sun } = this) {
  const forecast = this.forecasts ? this.forecasts.slice(0, forecastItems) : [];

  if (config.forecast.condition_icons === false) {
    return html``;
  }

  const totalMinWidth = forecast.length * this.columnMinWidth;

  // I forget where the magic "- 10" on totalMinWidth came from -- probably margin on .conditions or .wind-details
  return html`
    <div class="conditions" style="min-width: ${totalMinWidth - 10 + 'px'}" @click="${(e) => this.showMoreInfo(config.entity)}">
      ${forecast.map((item) => {
        const forecastTime = new Date(item.datetime);
        const sunriseTime = new Date(sun.attributes.next_rising);
        const sunsetTime = new Date(sun.attributes.next_setting);

        // Adjust sunrise and sunset times to match the date of forecastTime
        const adjustedSunriseTime = new Date(forecastTime);
        adjustedSunriseTime.setHours(sunriseTime.getHours());
        adjustedSunriseTime.setMinutes(sunriseTime.getMinutes());
        adjustedSunriseTime.setSeconds(sunriseTime.getSeconds());

        const adjustedSunsetTime = new Date(forecastTime);
        adjustedSunsetTime.setHours(sunsetTime.getHours());
        adjustedSunsetTime.setMinutes(sunsetTime.getMinutes());
        adjustedSunsetTime.setSeconds(sunsetTime.getSeconds());

        let isDayTime;

        if (config.forecast.type === 'daily') {
          // For daily forecast, assume it's day time
          isDayTime = true;
        } else {
          // For other forecast types, determine based on sunrise and sunset times
          isDayTime = forecastTime >= adjustedSunriseTime && forecastTime <= adjustedSunsetTime;
        }

        const weatherIcons = isDayTime ? weatherIconsDay : weatherIconsNight;
        const condition = item.condition;

        let iconHtml;

        if (config.animated_icons || config.icons) {
          const iconSrc = config.animated_icons ?
            `${this.baseIconPath}${weatherIcons[condition]}.svg` :
            `${this.config.icons}${weatherIcons[condition]}.svg`;
          iconHtml = html`<img class="icon" src="${iconSrc}" alt="">`;
        } else {
          iconHtml = html`<ha-icon icon="${this.getWeatherIcon(condition, sun.state)}"></ha-icon>`;
        }

        return html`
          <div class="forecast-item">
            ${iconHtml}
          </div>
        `;
      })}
    </div>
  `;
}

renderWind({ config, weather, windDirection, forecastItems } = this) {
  const showWindForecast = config.forecast.show_wind_forecast !== false;
  const showWindUnit = config.forecast.show_wind_unit;

  if (!showWindForecast) {
    return html``;
  }

  // Note: use weather attributes because forecast is always from weather, not
  // a custom sensor entity.
  const wind_speed_unit = weather.attributes.wind_speed_unit;

  const forecast = this.forecasts ? this.forecasts.slice(0, forecastItems) : [];
  const totalMinWidth = forecast.length * this.columnMinWidth;

  // I forget where the magic "- 10" on totalMinWidth came from -- probably margin on .conditions or .wind-details
  return html`
    <div class="wind-details" style="min-width: ${totalMinWidth - 10 + 'px'}">
      ${showWindForecast ? html`
        ${forecast.map((item) => {
          let dWindSpeed = this.convertSpeed(item.wind_speed, wind_speed_unit, this.unitSpeed);
          dWindSpeed = Math.round(dWindSpeed);

          return html`
            <div class="wind-detail">
              <ha-icon class="wind-icon" icon="hass:${this.getWindDirIcon(item.wind_bearing)}"></ha-icon>
              <div class="wind-speed-wrap">
                <span class="wind-speed">${dWindSpeed}</span>${showWindUnit ?
                html`<span class="wind-unit">${this.ll('units')[this.unitSpeed]}</span>` : ''}
              </div>
            </div>
          `;
        })}
      ` : ''}
    </div>
  `;
}

renderLastUpdated() {
  const lastUpdatedString = this.weather.last_changed;
  const lastUpdatedTimestamp = new Date(lastUpdatedString).getTime();
  const currentTimestamp = Date.now();
  const timeDifference = currentTimestamp - lastUpdatedTimestamp;

  const minutesAgo = Math.floor(timeDifference / (1000 * 60));
  const hoursAgo = Math.floor(minutesAgo / 60);

  const locale = this.language;

  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  let formattedLastUpdated;

  if (hoursAgo > 0) {
    formattedLastUpdated = formatter.format(-hoursAgo, 'hour');
  } else {
    formattedLastUpdated = formatter.format(-minutesAgo, 'minute');
  }

  const showLastUpdated = this.config.show_last_changed == true;

  if (!showLastUpdated) {
    return html``;
  }

  return html`
    <div class="updated">
      <div>
        ${formattedLastUpdated}
      </div>
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
