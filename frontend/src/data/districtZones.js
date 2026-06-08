/**
 * Sri Lanka district → agro zone mapping (updated)
 * Source: Department of Agriculture Sri Lanka
 *
 * Agro zone values match exactly what the ML model was trained on.
 * Broad zones ("Wet Zone", "Dry Zone") are display labels only —
 * the model receives specific sub-zones only.
 */

export const DISTRICTS = [
  "Ampara","Anuradhapura","Badulla","Batticaloa","Colombo","Galle",
  "Gampaha","Hambantota","Jaffna","Kalutara","Kandy","Kegalle",
  "Kilinochchi","Kurunegala","Mannar","Matale","Matara","Monaragala",
  "Mullaitivu","Nuwara Eliya","Polonnaruwa","Puttalam","Ratnapura",
  "Trincomalee","Vavuniya",
];

/** @type {Record<string, string[]>} */
export const DISTRICT_TO_ZONES = {
  Ampara:         ["Dry Zone","Low Country Dry Zone","Eastern Dry Zone","Dry Zone with Irrigation"],
  Anuradhapura:   ["Dry Zone","Low Country Dry Zone","Northern Dry Zone","Dry Zone with Irrigation"],
  Badulla:        ["Intermediate Zone","Mid Country Intermediate Zone","Up Country Intermediate Zone","Up Country Wet Zone"],
  Batticaloa:     ["Dry Zone","Low Country Dry Zone","Dry Coastal Zone","Eastern Dry Zone"],
  Colombo:        ["Low Country Wet Zone"],
  Galle:          ["Low Country Wet Zone"],
  Gampaha:        ["Low Country Wet Zone"],
  Hambantota:     ["Dry Zone","Low Country Dry Zone","Dry Coastal Zone"],
  Jaffna:         ["Dry Zone","Low Country Dry Zone","Dry Coastal Zone","Northern Dry Zone"],
  Kalutara:       ["Low Country Wet Zone"],
  Kandy:          ["Intermediate Zone","Mid Country Wet Zone","Mid Country Intermediate Zone"],
  Kegalle:        ["Mid Country Wet Zone"],
  Kilinochchi:    ["Dry Zone","Low Country Dry Zone","Dry Coastal Zone","Northern Dry Zone"],
  Kurunegala:     ["Dry Zone","Intermediate Zone","Low Country Intermediate Zone","Mid Country Intermediate Zone","Dry Zone with Irrigation"],
  Mannar:         ["Dry Zone","Low Country Dry Zone","Dry Coastal Zone","Northern Dry Zone"],
  Matale:         ["Dry Zone","Intermediate Zone","Mid Country Intermediate Zone","Up Country Intermediate Zone","Mahaweli H Zone"],
  Matara:         ["Intermediate Zone","Low Country Wet Zone","Low Country Intermediate Zone"],
  Monaragala:     ["Dry Zone","Intermediate Zone","Low Country Dry Zone","Low Country Intermediate Zone"],
  Mullaitivu:     ["Dry Zone","Low Country Dry Zone","Dry Coastal Zone","Northern Dry Zone"],
  "Nuwara Eliya": ["Intermediate Zone","Up Country Wet Zone","Up Country Intermediate Zone"],
  Polonnaruwa:    ["Dry Zone","Low Country Dry Zone","Dry Zone with Irrigation","Mahaweli H Zone"],
  Puttalam:       ["Dry Zone","Intermediate Zone","Low Country Dry Zone","Dry Coastal Zone","Low Country Intermediate Zone"],
  Ratnapura:      ["Mid Country Wet Zone","Low Country Wet Zone"],
  Trincomalee:    ["Dry Zone","Low Country Dry Zone","Dry Coastal Zone","Eastern Dry Zone"],
  Vavuniya:       ["Dry Zone","Low Country Dry Zone","Northern Dry Zone"],
};

