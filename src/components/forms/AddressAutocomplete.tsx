"use client";

import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";

export interface AddressResult {
  address: string;
  city: string;
  latitude: number;
  longitude: number;
}

interface AddressAutocompleteProps {
  onSelect: (result: AddressResult) => void;
  /** Called when the user types, so the parent can keep address in sync even if they don't pick a suggestion */
  onInputChange?: (value: string) => void;
  defaultValue?: string;
  placeholder?: string;
  id?: string;
  className?: string;
}

export function AddressAutocomplete({
  onSelect,
  onInputChange,
  defaultValue = "",
  placeholder = "Start typing an address...",
  id,
  className = "",
}: AddressAutocompleteProps) {
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      componentRestrictions: { country: "ca" },
      types: ["address"],
    },
    defaultValue,
  });

  async function handleSelect(description: string) {
    setValue(description, false);
    clearSuggestions();

    const results = await getGeocode({ address: description });
    if (!results?.[0]) return;
    const { lat, lng } = getLatLng(results[0]);

    const cityComponent = results[0].address_components?.find(
      (c) =>
        c.types.includes("locality") || c.types.includes("sublocality")
    );
    const city = cityComponent?.long_name ?? "";

    onSelect({
      address: description,
      city,
      latitude: lat,
      longitude: lng,
    });
  }

  return (
    <div className="relative">
      <input
        id={id}
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          setValue(v);
          onInputChange?.(v);
        }}
        onBlur={() => setTimeout(clearSuggestions, 200)}
        disabled={!ready}
        placeholder={placeholder}
        className={
          "w-full rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 " +
          className
        }
        autoComplete="off"
      />
      {status === "OK" && data.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-60 overflow-auto">
          {data.map(({ place_id, description }) => (
            <li
              key={place_id}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(description);
              }}
              className="cursor-pointer px-4 py-3 hover:bg-gray-50 text-sm"
            >
              {description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
