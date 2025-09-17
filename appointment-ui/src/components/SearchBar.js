import React from "react";

export default function SearchBar({ value, onChange, placeholder = "Search appointments..." }) {
  return (
    <div className="searchbar">
      <input
        type="search"
        className="form-control"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
