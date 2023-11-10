import { LitElement, html } from 'lit';

const ALT_SCHEMA = [
  { name: "temp", title: "Alternative temperature sensor", selector: { entity: { domain: 'sensor' } } },
  { name: "press", title: "Alternative pressure sensor", selector: { entity: { domain: 'sensor' } } },
  { name: "humid", title: "Alternative humidity sensor", selector: { entity: { domain: 'sensor' } } },
  { name: "uv", title: "Alternative UV index sensor", selector: { entity: { domain: 'sensor' } } },
  { name: "winddir", title: "Alternative wind bearing sensor", selector: { entity: { domain: 'sensor' } } },
  { name: "windspeed", title: "Alternative wind speed sensor", selector: { entity: { domain: 'sensor' } } },
];

class ContentCardEditor extends LitElement {
  static get properties() {
    return {
      _config: { type: Object },
      currentPage: { type: String },
      entities: { type: Array },
      hass: { type: Object },
      _entity: { type: String },
    };
  }

  constructor() {
    super();
    this.currentPage = 'card';
    this._entity = '';
    this.entities = [];
    this._formValueChanged = this._formValueChanged.bind(this);
  }

  setConfig(config) {
    if (!config) {
      throw new Error("Invalid configuration");
    }
    this._config = config;
    this._entity = config.entity || '';
    this.requestUpdate();
  }

  get config() {
    return this._config;
  }

  updated(changedProperties) {
    if (changedProperties.has('hass')) {
      this.fetchEntities();
    }
    if (changedProperties.has('_config') && this._config && this._config.entity) {
      this._entity = this._config.entity;
    }
  }

  fetchEntities() {
    if (this.hass) {
      this.entities = Object.keys(this.hass.states).filter((e) =>
        e.startsWith('weather.')
      );
    }
  }

  configChanged(newConfig) {
    const event = new Event("config-changed", {
      bubbles: true,
      composed: true,
    });
    event.detail = { config: newConfig };
    this.dispatchEvent(event);
  }

  _EntityChanged(event, key) {
    if (!this._config) {
      return;
    }

    const newConfig = { ...this._config };

    if (key === 'entity') {
      newConfig.entity = event.target.value;
      this._entity = event.target.value;
    }

    this.configChanged(newConfig);
    this.requestUpdate();
  }

  _valueChanged(event, key) {
    if (!this._config) {
      return;
    }

    let newConfig = { ...this._config };

    if (key.includes('.')) {
      const parts = key.split('.');
      let currentLevel = newConfig;

      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];

        currentLevel[part] = { ...currentLevel[part] };

        currentLevel = currentLevel[part];
      }

      const finalKey = parts[parts.length - 1];
      if (event.target.checked !== undefined) {
        currentLevel[finalKey] = event.target.checked;
      } else {
        currentLevel[finalKey] = event.target.value;
      }
    } else {
      if (event.target.checked !== undefined) {
        newConfig[key] = event.target.checked;
      } else {
        newConfig[key] = event.target.value;
      }
    }

    this.configChanged(newConfig);
    this.requestUpdate();
  }

  _handleStyleChange(event) {
    if (!this._config) {
      return;
    }
    const newConfig = JSON.parse(JSON.stringify(this._config));
    newConfig.forecast.style = event.target.value;
    this.configChanged(newConfig);
    this.requestUpdate();
  }

  _handleTypeChange(event) {
    if (!this._config) {
      return;
    }
    const newConfig = JSON.parse(JSON.stringify(this._config));
    newConfig.forecast.type = event.target.value;
    this.configChanged(newConfig);
    this.requestUpdate();
  }

  _handlePrecipitationTypeChange(e) {
    const newValue = e.target.value;
    this.config.forecast.precipitation_type = newValue;
  }

  _formValueChanged(event) {
    if (event.target.tagName.toLowerCase() === 'ha-form') {
      const newConfig = event.detail.value;
      this.configChanged(newConfig);
      this.requestUpdate();
    }
  }

  showPage(pageName) {
    this.currentPage = pageName;
    this.requestUpdate();
  }

  render() {
    if (this._config && this._config.entity !== this._entity) {
      this._entity = this._config.entity;
    }
    const forecastConfig = this._config.forecast || {};
    const unitsConfig = this._config.units || {};
    const isShowTimeOn = this._config.show_time !== false;


    return html`
      <style>
        .switch-label {
          padding-left: 14px;
        }
        .switch-container {
          margin-bottom: 12px;
        }
        .page-container {
	  display: none;
        }
        .page-container.active {
          display: block;
        }
        .time-container {
          display: flex;
          flex-direction: row;
          margin-top: 0px;
        }
        .switch-right {
          display: flex;
          align-items: center;
          margin-top: 0px;
        }
        .textfield-container {
          display: flex;
          flex-direction: column;
          margin-bottom: 10px;
	  gap: 20px;
        }
        .radio-container {
          display: flex;
        }
        .radio-group {
          display: flex;
          align-items: center;
        }
        .radio-group label {
          margin-left: 4px;
        }
	div.buttons-container {
          border-bottom: 2px solid #ccc;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
      </style>
      <div>
      <div class="textfield-container">
      <ha-select
        naturalMenuWidth
        fixedMenuPosition
        label="Entity"
        .configValue=${'entity'}
        .value=${this._entity}
        @change=${(e) => this._EntityChanged(e, 'entity')}
        @closed=${(ev) => ev.stopPropagation()}
      >
        ${this.entities.map((entity) => {
          return html`<ha-list-item .value=${entity}>${entity}</ha-list-item>`;
        })}
      </ha-select>
      <ha-textfield
        label="Title"
        .value="${this._config.title || ''}"
        @change="${(e) => this._valueChanged(e, 'title')}"
      ></ha-textfield>
       </div>

      <h5>Forecast type:</h5>

      <div class="radio-group">
        <ha-radio
          name="type"
          value="daily"
          @change="${this._handleTypeChange}"
          .checked="${forecastConfig.type === 'daily'}"
        ></ha-radio>
        <label class="check-label">
          Daily forecast
        </label>
      </div>

      <div class="radio-group">
        <ha-radio
          name="type"
          value="hourly"
          @change="${this._handleTypeChange}"
          .checked="${forecastConfig.type === 'hourly'}"
        ></ha-radio>
        <label class="check-label">
          Hourly forecast
        </label>
      </div>

      <h5>Chart style:</h5>
      <div class="radio-container">
        <div class="switch-right">
          <ha-radio
            name="style"
            value="style1"
            @change="${this._handleStyleChange}"
            .checked="${forecastConfig.style === 'style1'}"
          ></ha-radio>
          <label class="check-label">
            Chart style 1
          </label>
        </div>

        <div class="switch-right">
          <ha-radio
            name="style"
            value="style2"
            @change="${this._handleStyleChange}"
            .checked="${forecastConfig.style === 'style2'}"
          ></ha-radio>
          <label class="check-label">
            Chart style 2
          </label>
        </div>
      </div>

        <!-- Buttons to switch between pages -->
       <h4>Settings:</h4>
       <div class="buttons-container">
         <mwc-button @click="${() => this.showPage('card')}">Main</mwc-button>
         <mwc-button @click="${() => this.showPage('forecast')}">Forecast</mwc-button>
         <mwc-button @click="${() => this.showPage('units')}">Units</mwc-button>
         <mwc-button @click="${() => this.showPage('alternate')}">Alternate entities</mwc-button>
       </div>

        <!-- Card Settings Page -->
        <div class="page-container ${this.currentPage === 'card' ? 'active' : ''}">
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
              @change="${(e) => this._valueChanged(e, 'show_current_condition')}"
              .checked="${this._config.show_current_condition !== false}"
            ></ha-switch>
            <label class="switch-label">
              Show Current Weather Condition
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
              @change="${(e) => this._valueChanged(e, 'show_sun')}"
              .checked="${this._config.show_sun !== false}"
            ></ha-switch>
            <label class="switch-label">
              Show Sun
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
        <div class="time-container">
          <div class="switch-right">
            <ha-switch
              @change="${(e) => this._valueChanged(e, 'show_time')}"
              .checked="${this._config.show_time !== false}"
            ></ha-switch>
            <label class="switch-label">
              Show Current Time
            </label>
          </div>
          <div class="switch-right">
            <ha-checkbox
              @change="${(e) => this._valueChanged(e, 'show_day')}"
              .checked="${this._config.show_day !== false}"
            ></ha-checkbox>
            <label class="check-label">
              Show Day
            </label>
          </div>
          <div class="switch-right">
            <ha-checkbox
              @change="${(e) => this._valueChanged(e, 'show_date')}"
              .checked="${this._config.show_date !== false}"
            ></ha-checkbox>
            <label class="check-label">
              Show Date
            </label>
          </div>
        </div>
	  <div class="textfield-container">
          <ha-textfield
            label="Curent temperature Font Size"
            .value="${this._config.current_temp_size || '28'}"
            @change="${(e) => this._valueChanged(e, 'current_temp_size')}"
          ></ha-textfield>
        <ha-textfield
          label="Custom icon path"
          .value="${this._config.icons || ''}"
          @change="${(e) => this._valueChanged(e, 'icons')}"
        ></ha-textfield>
        </div>
        </div>

        <!-- Forecast Settings Page -->
        <div class="page-container ${this.currentPage === 'forecast' ? 'active' : ''}">
          <div class="switch-container">
            <ha-switch
              @change="${(e) => this._valueChanged(e, 'forecast.condition_icons')}"
              .checked="${forecastConfig.condition_icons !== false}"
            ></ha-switch>
            <label class="switch-label">
              Show Condition Icons
            </label>
          </div>
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
              @change="${(e) => this._valueChanged(e, 'forecast.round_temp')}"
              .checked="${forecastConfig.round_temp !== false}"
            ></ha-switch>
            <label class="switch-label">
              Rounding Temperatures
            </label>
          </div>
	  <div class="textfield-container">
          <ha-select
            naturalMenuWidth
            fixedMenuPosition
            label="Precipitation Type (Probability if supported by the weather entity)"
            .configValue=${'forecast.precipitation_type'}
            .value=${forecastConfig.precipitation_type}
            @change=${(e) => this._valueChanged(e, 'forecast.precipitation_type')}
            @closed=${(ev) => ev.stopPropagation()}
          >
            <ha-list-item .value=${'rainfall'}>Rainfall</ha-list-item>
            <ha-list-item .value=${'probability'}>Probability</ha-list-item>
          </ha-select>
          <ha-textfield
            label="Labels Font Size"
            .value="${forecastConfig.labels_font_size || '11'}"
            @change="${(e) => this._valueChanged(e, 'forecast.labels_font_size')}"
          ></ha-textfield>
	  </div>
        </div>

        <!-- Units Page -->
        <div class="page-container ${this.currentPage === 'units' ? 'active' : ''}">
          <div class="textfield-container">
            <ha-select
              naturalMenuWidth
              fixedMenuPosition
              label="Convert pressure to"
              .configValue=${'units.pressure'}
              .value=${unitsConfig.pressure}
              @change=${(e) => this._valueChanged(e, 'units.pressure')}
              @closed=${(ev) => ev.stopPropagation()}
            >
              <ha-list-item .value=${'hPa'}>hPa</ha-list-item>
              <ha-list-item .value=${'mmHg'}>mmHg</ha-list-item>
              <ha-list-item .value=${'inHg'}>inHg</ha-list-item>
            </ha-select>
            <ha-select
              naturalMenuWidth
              fixedMenuPosition
              label="Convert wind speed to"
              .configValue=${'units.speed'}
              .value=${unitsConfig.speed}
              @change=${(e) => this._valueChanged(e, 'units.speed')}
              @closed=${(ev) => ev.stopPropagation()}
            >
              <ha-list-item .value=${'km/h'}>km/h</ha-list-item>
              <ha-list-item .value=${'m/s'}>m/s</ha-list-item>
              <ha-list-item .value=${'Bft'}>Bft</ha-list-item>
              <ha-list-item .value=${'mph'}>mph</ha-list-item>
            </ha-select>
          </div>
        </div>

        <!-- Alternate Page -->
        <div class="page-container ${this.currentPage === 'alternate' ? 'active' : ''}">
          <h5>Alternative sensors for the main card attributes:</h5>
          <ha-form
            .data=${this._config}
            .schema=${ALT_SCHEMA}
            .hass=${this.hass}
            @value-changed=${this._formValueChanged}
          ></ha-form>
        </div>
    `;
  }
}
customElements.define("content-card-editor", ContentCardEditor);
