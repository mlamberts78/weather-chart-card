class ContentCardEditor extends LitElement {
  static get properties() {
    return {
      hass: {},
      config: {},
    };
  }

  setConfig(config) {
    this.config = config;
  }

  handleInputChange(event, configKey, isBoolean = false) {
    const value = isBoolean ? event.target.checked : event.target.value;
    this.config = { ...this.config, [configKey]: value };
    this.dispatchEvent(new Event('config-changed'));
  }

  render() {
    const { config } = this;
    if (!config) {
      return html``;
    }

    return html`
      <div>
        <paper-input
          label="Entity"
          .value="${config.entity || ''}"
          @value-changed="${(e) => this.handleInputChange(e, 'entity')}"
        ></paper-input>
        <paper-checkbox
          @change="${(e) => this.handleInputChange(e, 'show_main', true)}"
          .checked="${config.show_main !== false}"
        >Show Main</paper-checkbox>
        <paper-checkbox
          @change="${(e) => this.handleInputChange(e, 'show_attributes', true)}"
          .checked="${config.show_attributes !== false}"
        >Show Attributes</paper-checkbox>
        <paper-checkbox
          @change="${(e) => this.handleInputChange(e, 'show_humidity', true)}"
          .checked="${config.show_humidity !== false}"
        >Show Humidity</paper-checkbox>
        <paper-checkbox
          @change="${(e) => this.handleInputChange(e, 'show_pressure', true)}"
          .checked="${config.show_pressure !== false}"
        >Show Pressure</paper-checkbox>
        <paper-checkbox
          @change="${(e) => this.handleInputChange(e, 'show_wind_direction', true)}"
          .checked="${config.show_wind_direction !== false}"
        >Show Wind Direction</paper-checkbox>
        <paper-checkbox
          @change="${(e) => this.handleInputChange(e, 'show_wind_speed', true)}"
          .checked="${config.show_wind_speed !== false}"
        >Show Wind Speed</paper-checkbox>
        <div>
          <paper-input
            label="Labels Font Size"
            type="number"
            .value="${config.forecast.labels_font_size || ''}"
            @value-changed="${(e) => this.handleInputChange(e, 'forecast.labels_font_size')}"
          ></paper-input>
        </div>
        <paper-checkbox
          @change="${(e) => this.handleInputChange(e, 'forecast.show_wind_forecast', true)}"
          .checked="${config.forecast.show_wind_forecast !== false}"
        >Show Wind Forecast</paper-checkbox>
        <paper-checkbox
          @change="${(e) => this.handleInputChange(e, 'forecast.condition_icons', true)}"
          .checked="${config.forecast.condition_icons !== false}"
        >Condition Icons</paper-checkbox>
        <div>
          <paper-dropdown-menu label="Pressure Units">
            <paper-listbox
              slot="dropdown-content"
              .selected="${['hPa', 'mmHg', 'in'].indexOf(config.units.pressure)}"
              @selected-changed="${(e) => this.handleInputChange(e, 'units.pressure')}"
            >
              <paper-item>hPa</paper-item>
              <paper-item>mmHg</paper-item>
              <paper-item>in</paper-item>
            </paper-listbox>
          </paper-dropdown-menu>
        </div>
        <div>
          <paper-dropdown-menu label="Speed Units">
            <paper-listbox
              slot="dropdown-content"
              .selected="${['km/h', 'm/s'].indexOf(config.units.speed)}"
              @selected-changed="${(e) => this.handleInputChange(e, 'units.speed')}"
            >
              <paper-item>km/h</paper-item>
              <paper-item>m/s</paper-item>
            </paper-listbox>
          </paper-dropdown-menu>
        </div>
      </div>
    `;
  }
}

customElements.define('content-card-editor', ContentCardEditor);
