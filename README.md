# Toyota Card Localized for Home Assistant

A dashboard card for Toyotas in the **MyToyota** or **Toyota** app, using either the European [Toyota integration (`pytoyoda/ha_toyota`)](https://github.com/pytoyoda/ha_toyota) or the North American [Toyota (North America) integration (`widewing/ha-toyota-na`)](https://github.com/widewing/ha-toyota-na). One card that answers "is the car locked, and how much fuel is in it?".

**📖 [Original card guide and demo](https://mymediabuild.uk/toyota-home-assistant-card/)** · **☕ [Buy me a coffee](https://buymeacoffee.com/bobgreggr)**

![Toyota card demo](images/demo.gif)

## What it shows

- Your car's photo, in your colour, straight from the Toyota integration (when provided)
- Doors, boot / trunk, bonnet / hood, windows and warning lights, in amber or red when something needs attention
- A top-down car with each door and individual window state at its corner (or tire pressures + windows on North American vehicles without door sensors)
- Range, odometer and a red / amber / green fuel gauge
- Average mpg, the share of miles driven on electric, the hybrid score and the last trip score (European `ha_toyota`)
- For electric and plug-in hybrid cars with battery data, a battery gauge, electric range and charging status
- Optional extra information: weekly average speed, recent trips, climate, seat heating and hazard lights (`ha_toyota`), or current speed, remote start and trip A/B (`ha-toyota-na`)
- Last service date and miles since (`ha_toyota`), or distance until next service (`ha-toyota-na`)
- When the car last reported in (tap it to ask the car for a fresh update)
- Where it's parked: "home" or the distance from home (tap it to open Google Maps)

It lays itself out for phones, tablets and full-page panel views.

| iPad | Phone | Alerts |
|---|---|---|
| ![iPad](images/ipad.webp) | ![Phone](images/phone.webp) | ![Alerts](images/alerts.webp) |

## Requirements

- Home Assistant with one of these integrations from Marketplace (HACS before 2026.11):
  - **Europe / UK**: [pytoyoda/ha_toyota](https://github.com/pytoyoda/ha_toyota)
  - **North America**: [widewing/ha-toyota-na](https://github.com/widewing/ha-toyota-na)
- A Toyota with connected services in the MyToyota / Toyota app.

## Install

### Side-by-side installation

1. Download `toyota-card-localized.js` from [Releases](../../releases) and copy it to `config/www/toyota-card-localized.js`.
2. In **Settings → Dashboards → ⋮ → Resources**, add `/local/toyota-card-localized.js?v=1.3.0` as a **JavaScript module** and reload your browser.
3. Add the example below to a separate test dashboard or view.

This fork registers `custom:toyota-card-localized` and can run alongside the original card and resource. The card uses the current Home Assistant frontend language automatically. English, Russian and German are supported, including regional variants. Other languages use English labels with local number and date formats.

## Use

Add a card in YAML mode:

```yaml
type: custom:toyota-card-localized
```

That's it. The card finds your car on its own. If you have more than one Toyota, pick one with `prefix`:

```yaml
type: custom:toyota-card-localized
prefix: abc123def456   # ha_toyota: the part between "sensor." and "_odometer"
                       # ha-toyota-na: the part after "sensor.odometer_" (e.g. 2024_rav4)
```

| Option | Default | What it does |
|---|---|---|
| `prefix` | first Toyota found | Which car to show (entity ID prefix for `ha_toyota`, or model suffix for `ha-toyota-na`) |
| `units` | `imperial` | `metric` shows km, km/h and L/100 km; `imperial` shows miles, mph and UK mpg |
| `show_extra_info` | `false` | Set to `true` to show optional extra vehicle details |
| `image` | integration `entity_picture` | Optional image URL or `/local/...` path for the car photo (useful for `ha-toyota-na`, which does not provide `entity_picture`) |

The battery gauge appears automatically when the selected car reports a numeric battery level (for example, an electric or plug-in hybrid Toyota). `show_extra_info` is opt-in, so existing cards keep their current layout unless you enable it.

The card switches to two columns at 760 CSS pixels of available content width. The vehicle photo and status sit beside the trip, service and door details. Narrower cards stack vertically. The layout is built into the card.

### Units

The `units` option applies to vehicle and electric range, odometer, distance from home, distance since last service (or until next service), and speed. Sensors that report their own unit (`mi` or `km`) are converted automatically. Set `units: metric` to keep metric units, or `units: imperial` to show **miles**, **mph** and **UK mpg**. The default remains `imperial` so existing cards keep their current display.

## Notes

- Door, window, lock and bonnet / hood states are only as fresh as the car's last report. Tap the time in the top-left corner to request an update.
- The parked distance uses your Home zone.
- On European `ha_toyota` vehicles, tyre pressures aren't available from Toyota, so the corners of the top-down car show each door instead. On North American `ha-toyota-na` vehicles without door sensors, tire pressures (`psi`) are shown at each corner. Individual window states (`open` / `closed` or `shut`) are also shown at each corner and highlighted on the car diagram whenever valid window sensors are exposed.

## Support and requests

- **Found a bug?** [Open an issue](../../issues/new/choose) and fill in the form. A screenshot and the entity list help a lot.
- **Want another car brand or a new feature?** Use the feature request form. Pull requests are very welcome. I build this in my spare time and can only test on my own car, so I can't promise every request.
- **Like the card?** A ⭐ on GitHub helps other people find it, and you can [buy me a coffee](https://buymeacoffee.com/bobgreggr) ☕. More free Home Assistant cards and guides at [mymediabuild.uk](https://mymediabuild.uk).

## Thanks

Big thanks to **CM000n** and **deejay1** for maintaining the Toyota integration and pytoyoda, and to **Simon Hansen (DurgNomis-drol)** for starting it. There's no official Toyota API, so they keep it working as Toyota changes things.

More free Home Assistant cards and guides at [mymediabuild.uk](https://mymediabuild.uk). If you find this useful, you can [buy me a coffee](https://buymeacoffee.com/bobgreggr) ☕ (no pressure).

## Licence

MIT. Not affiliated with or endorsed by Toyota.
