let baseElement;

export const eventName = "weather_chart_update"

const refreshTheme = () => document.dispatchEvent(new Event(eventName));

export const getHass =  async () => {
  if (baseElement === undefined) {
    const element = "home-assistant"
    await customElements.whenDefined(element);
    while (!document.querySelector(element))
      await new Promise((r) => window.setTimeout(r, 100));
    baseElement = document.querySelector(element);
    while (!baseElement.hass) await new Promise((r) => window.setTimeout(r, 100));
  }
  return baseElement.hass
}

getHass().then((hass) => window.setTimeout(() => {
  hass.connection.subscribeEvents(() => {
    window.setTimeout(refreshTheme, 500);
  }, "themes_updated");
  if (!window.matchMedia) return;
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', () => {
      window.setTimeout(refreshTheme, 500);
    });
}, 1000));
