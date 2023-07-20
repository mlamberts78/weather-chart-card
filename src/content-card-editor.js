import { LitElement, html } from 'lit';

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
