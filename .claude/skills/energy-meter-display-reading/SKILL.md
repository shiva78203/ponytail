---
name: energy-meter-display-reading
description: Read and explain kWh/Wh energy readings from photos of 3-row LED multifunction meters (Schneider Conzerv EM6400-series and similar panel meters with K/M multiplier lamps). Use this whenever the user shares a photo of a panel/energy meter display, gives digits read off such a meter (e.g. "2583.9968", "58.3 9468"), or asks what a meter reading means, how many units/kWh it is, or asks to explain a reading "detailly" or in layman terms — even if they don't name the meter model.
---

# Energy Meter Display Reading

Turns a photo (or typed digits) of a multifunction meter's energy page into a correct kWh/units figure, and explains it at the level the user wants.

## 1. Identify the page

- Typical meter: Schneider Conzerv EM6400-series, 3 rows × 4 digits, phase labels L1/L2/L3 on the left, small **K** and **M** lamps beside each row, %A FS bar graph on the right.
- **Top row** shows the parameter name. Confirm it is **Wh** (active energy, billing value). If it is VAh or VARh, say so — those are not units/kWh.
- If the page could be the **OLD** (frozen, pre-reset) page rather than **INTG** (live), mention it.

## 2. Decode the 8-digit energy number

On energy pages the **middle row + bottom row form one 8-digit number**:

1. Read the middle row exactly, including its decimal point position (e.g. `258.3`).
2. Append the bottom row straight after it (e.g. `9468`) → `258.39468`.
3. Apply the lit multiplier lamp: **M → MWh**, **K → kWh**.
4. Convert to kWh (= units): MWh × 1000.

Worked example (real case): middle `258.3`, bottom `9468`, M lit → **258.39468 MWh = 258,394.68 kWh (2,58,394.68 units)**.

### Reading carefully
- Only **bright** segments are digits. Dim/reflected segments look like 2, 8 or 0 — flag uncertainty instead of guessing.
- **If the user corrects a digit from seeing the meter in person, accept their correction** and recalculate. They saw it on site; the photo may be dark or blurred.
- The decimal point position matters: 258.39468 MWh is not 2583.9968. If the user's typed number doesn't match the photo, show the decoding from the photo, give the result for their number too (under both K and M), and ask which they saw.
- The meter auto-ranges (decimal and K/M shift as energy grows), so always record digits + decimal + lamp together.

## 3. Things to always check / mention when relevant

- **CT/PT ratio**: if programmed in the meter, the display shows primary energy (use as-is). If the meter is set to 5/5 or 1/1 but the panel uses e.g. 400/5 CTs, multiply by the ratio (×80). Confirm against the CT nameplate.
- **Consumption** = present reading − previous reading. Average load (kW) = kWh ÷ hours. Cost = kWh × tariff.
- **Average PF** ≈ Wh ÷ VAh (if the user provides the VAh page).
- **Accuracy check** (for meter testing work): % Error = (Meter − Reference) ÷ Reference × 100, compared against the accuracy class on the nameplate.

## 4. Explaining at the right level

**Standard answer** (default): lead with the final figure in MWh and kWh, then a short decoding table (row → digits) and key cautions.

**"Detailly" / more detail**: add what Wh means (P = V × I × cos φ integrated over time), Wh vs VAh vs VARh, consumption/cost calculation, common reading mistakes, accuracy-check formula, and a recording table.

**Layman**: use simple words and an analogy:
- The meter is like a car's **odometer** — it shows total electricity used so far and only goes up.
- **1 unit = 1 kWh** (same as on the electricity bill). Roughly: a 1-ton AC for ~1 hour, a fan for ~13–14 hours, a 10 W LED for ~100 hours.
- Three rules: count only bright digits; check whether K or M is lit (M → ×1000 for units); make sure the top line says "Wh".
- Offer to explain in Telugu if the user seems more comfortable in it.

Lead with the answer. Keep it to about a phone screen unless the user asks for more detail.

## 5. Recording format

| Field | Value |
|---|---|
| Make / Model | e.g. Schneider Conzerv EM6400 |
| Display (rows 2+3) | e.g. 258.3 / 9468 |
| Multiplier lamp | M or K |
| Reading | e.g. 258.39468 MWh |
| Reading in kWh | e.g. 258,394.68 kWh |
| CT / PT ratio | ___ / ___ |
| Date & time | ___ |
| Remarks | e.g. Tested OK sticker date |

Write both MWh and kWh in reports to avoid confusion.
