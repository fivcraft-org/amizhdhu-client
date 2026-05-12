import { useState } from "react";
import { TextInput, Menu } from "@mantine/core";
import { ChevronDown } from "lucide-react";
import inFlag from "../../assets/flags/in.svg";


export default function PhoneInput({
  label = "Phone Number",
  value,
  error,
  required = false,
  onChange,
  onCountryChange,
  onInvalidInput,
}) {
  const COUNTRIES = [
    { value: "IN", name: "India", code: "+91", flag: inFlag },
  ];
  const [country, setCountry] = useState(COUNTRIES[0]); // India default

  const handlePhoneChange = (e) => {
    const rawVal = e.target.value;
    const digits = rawVal.replace(/\D/g, "");
    
    if (/\D/.test(rawVal)) {
      onInvalidInput?.("Phone number field cannot contain Alphabets or Special Characters");
    } else if (digits.length > 0 && /^[1-5]/.test(digits)) {
      onInvalidInput?.("Phone number must start with 6, 7, 8, or 9");
      return;
    } else {
      onInvalidInput?.("");
    }
    
    if (digits.length <= 10) onChange?.(digits);
  };

  return (
    <TextInput
      label={label}
      withAsterisk={required}
      value={value}
      placeholder="Enter phone number"
      error={error}
      inputMode="numeric"
      pattern="[0-9]*"
      onChange={handlePhoneChange}
      leftSection={
        <Menu width={260} position="bottom-start">
          <Menu.Target>
            <div className="flex items-center gap-2 px-2 cursor-pointer min-w-[100px]">
              <img
                src={country.flag}
                alt={country.name}
                className="w-5 h-4 rounded-sm"
              />
              <span className="text-sm font-medium">{country.code}</span>
              <ChevronDown size={14} />
            </div>
          </Menu.Target>

          <Menu.Dropdown>
            {COUNTRIES.map((c) => (
              <Menu.Item
                key={c.value}
                onClick={() => {
                  setCountry(c);
                  onCountryChange?.(c);
                }}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={c.flag}
                    alt={c.name}
                    className="w-5 h-4 rounded-sm"
                  />
                  <span className="text-sm">
                    {c.name}{" "}
                    <span className="text-gray-400">({c.code})</span>
                  </span>
                </div>
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>
      }
      styles={{
        input: {
          paddingLeft: "95px",
        },
        section: {
          width: "110px",
        },
      }}
    />
  );
}
