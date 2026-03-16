"use client";

import { useEffect, useState, useRef, useImperativeHandle, forwardRef } from "react";
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

export interface AddressAutocompleteRef {
  getValue: () => string;
}

interface AddressAutocompleteProps {
  onSelect: (result: AddressResult) => void;
  onInputChange?: (value: string) => void;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  id?: string;
  className?: string;
}

const AddressAutocompleteInner = forwardRef<AddressAutocompleteRef, AddressAutocompleteProps>(function AddressAutocompleteInner(
  {
    onSelect,
    onInputChange,
    value: controlledValue,
    defaultValue = "",
    placeholder = "Start typing an address...",
    id,
    className = "",
  },
  ref
) {
  const inputRef = useRef<HTMLInputElement>(null);
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
    defaultValue: controlledValue ?? defaultValue,
  });

  const isControlled = controlledValue !== undefined;
  const [justSelected, setJustSelected] = useState<string | null>(null);

  const displayValue = (justSelected ?? (isControlled ? controlledValue : value)) ?? "";

  useEffect(() => {
    if (isControlled && controlledValue !== value) {
      setValue(controlledValue, false);
    }
  }, [isControlled, controlledValue, setValue, value]);

  useEffect(() => {
    if (justSelected !== null && controlledValue === justSelected) {
      setJustSelected(null);
    }
  }, [justSelected, controlledValue]);

  useImperativeHandle(ref, () => ({
    getValue: () => inputRef.current?.value?.trim() ?? "",
  }), []);

  async function handleSelect(description: string) {
    setJustSelected(description);
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
        ref={inputRef}
        id={id}
        value={displayValue}
        onChange={(e) => {
          const v = e.target.value;
          setJustSelected(null);
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
});

export const AddressAutocomplete = AddressAutocompleteInner;
