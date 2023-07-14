const fireEvent = (node, type, detail, options) => {
  options = options || {};
  detail = detail === null || detail === undefined ? {} : detail;
  const event = new Event(type, {
    bubbles: options.bubbles === undefined ? true : options.bubbles,
    cancelable: Boolean(options.cancelable),
    composed: options.composed === undefined ? true : options.composed,
  });
  event.detail = detail;
  node.dispatchEvent(event);
  return event;
};

if (
  !customElements.get("ha-switch") &&
  customElements.get("paper-toggle-button")
) {
  customElements.define("ha-switch", customElements.get("paper-toggle-button"));
}

const LitElement = customElements.get("hui-masonry-view")
  ? Object.getPrototypeOf(customElements.get("hui-masonry-view"))
  : Object.getPrototypeOf(customElements.get("hui-view"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

const HELPERS = window.loadCardHelpers();

export class WeatherCardEditor extends LitElement {
  setConfig(config) {
    this._config = { ...config };
  }

  static get properties() {
    return { hass: {}, _config: {} };
  }

  get _entity() {
    return this._config.entity || "";
  }

  get _show_main() {
    return this._config.show_main !== false;
  }

  get _show_attributes() {
    return this._config.show_attributes !== false;
  }

  get _show_humidity() {
    return this._config.show_humidity !== false;
  }

  get _show_pressure() {
    return this._config.show_pressure !== false;
  }

  get _show_wind_direction() {
    return this._config.show_wind_direction !== false;
  }

  get _show_wind_speed() {
    return this._config.show_wind_speed !== false;
  }

  get _name() {
    return this._config.name || "";
  }

  get _icons() {
    return this._config.icons || "";
  }

  firstUpdated() {
    HELPERS.then((help) => {
      if (help.importMoreInfoControl) {
        help.importMoreInfoControl("fan");
      }
    });
  }

  render() {
    if (!this.hass) {
      return html``;
    }

    const entities = Object.keys(this.hass.states).filter(
      (eid) => eid.substr(0, eid.indexOf(".")) === "weather"
    );

    return html`
      <div class="card-config">
        <div>
          <paper-input
            label="Name"
            .value="${this._name}"
            .configValue="${"name"}"
            @value-changed="${this._valueChanged}"
          ></paper-input>
          <paper-input
            label="Icons location"
            .value="${this._icons}"
            .configValue="${"icons"}"
            @value-changed="${this._valueChanged}"
          ></paper-input>
          ${customElements.get("ha-entity-picker")
            ? html`
                <ha-entity-picker
                  .hass="${this.hass}"
                  .value="${this._entity}"
                  .configValue=${"entity"}
                  domain-filter="weather"
                  @change="${this._valueChanged}"
                  allow-custom-entity
                ></ha-entity-picker>
              `
            : html`
                <paper-dropdown-menu
                  label="Entity"
                  @value-changed="${this._valueChanged}"
                  .configValue="${"entity"}"
                >
                  <paper-listbox
                    slot="dropdown-content"
                    .selected="${entities.indexOf(this._entity)}"
                  >
                    ${entities.map((entity) => {
                      return html` <paper-item>${entity}</paper-item> `;
                    })}
                  </paper-listbox>
                </paper-dropdown-menu>
              `}
          <div class="switches">
            <div class="switch">
              <ha-switch
                .checked=${this._show_main}
                .configValue="${"show_main"}"
                @change="${this._valueChanged}"
              ></ha-switch
              ><span>Show main</span>
            </div>
            <div class="switch">
              <ha-switch
                .checked=${this._show_attributes}
                .configValue="${"show_attributes"}"
                @change="${this._valueChanged}"
              ></ha-switch
              ><span>Show attributes</span>
            </div>
            <div class="switch">
              <ha-switch
                .checked=${this._show_humidity}
                .configValue="${"show_humidity"}"
                @change="${this._valueChanged}"
              ></ha-switch
              ><span>Show humidity</span>
            </div>
            <div class="switch">
              <ha-switch
                .checked=${this._show_pressure}
                .configValue="${"show_pressure"}"
                @change="${this._valueChanged}"
              ></ha-switch
              ><span>Show pressure</span>
            </div>
            <div class="switch">
              <ha-switch
                .checked=${this._show_wind_direction}
                .configValue="${"show_wind_direction"}"
                @change="${this._valueChanged}"
              ></ha-switch
              ><span>Show wind direction</span>
            </div>
            <div class="switch">
              <ha-switch
                .checked=${this._show_wind_speed}
                .configValue="${"show_wind_speed"}"
                @change="${this._valueChanged}"
              ></ha-switch
              ><span>Show wind speed</span>
            </div>
          </div>
          <paper-input
            label="Number of future forecasts"
            type="number"
            min="1"
            max="8"
            value=${this._number_of_forecasts}
            .configValue="${"number_of_forecasts"}"
            @value-changed="${this._valueChanged}"
          ></paper-input>
        </div>
      </div>
    `;
  }

  _valueChanged(ev) {
    if (!this._config || !this.hass) {
      return;
    }
    const target = ev.target;
    if (this[`_${target.configValue}`] === target.value) {
      return;
    }
    if (target.configValue) {
      if (target.value === "") {
        delete this._config[target.configValue];
      } else {
        this._config = {
          ...this._config,
          [target.configValue]:
            target.checked !== undefined ? target.checked : target.value,
        };
      }
    }
    fireEvent(this, "config-changed", { config: this._config });
  }

  static get styles() {
    return css`
      .switches {
        margin: 8px 0;
        display: flex;
        justify-content: space-between;
      }
      .switch {
        display: flex;
        align-items: center;
        justify-items: center;
      }
      .switches span {
        padding: 0 16px;
      }
    `;
  }
}

customElements.define("weather-card-editor", WeatherCardEditor);

