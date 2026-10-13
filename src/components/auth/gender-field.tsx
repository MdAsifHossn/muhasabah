"use client";

/**
 * Sign-up offers exactly two choices. `OTHER` stays in the database as a
 * legacy/never-set state only — admins can fix such members from the
 * members-management page.
 */
export const GENDER_OPTIONS = [
  { value: "MALE", label: "পুরুষ" },
  { value: "FEMALE", label: "নারী" },
] as const;

type GenderFieldProps = {
  /** React `key`-ish prefix so ids stay unique when two forms render together. */
  idPrefix: string;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
};

/**
 * Required, no silent default: the user has to actively pick one of
 * পুরুষ / নারী before the sign-up button becomes usable.
 * `text-base` on the labels keeps iOS from zooming into the inputs.
 */
export function GenderField({ idPrefix, value, onChange, error }: GenderFieldProps) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-stone-700">
        লিঙ্গ <span className="text-red-600">*</span>
      </legend>
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-stone-200 bg-stone-100 p-1">
        {GENDER_OPTIONS.map((option) => {
          const checked = value === option.value;
          return (
            <label
              key={option.value}
              htmlFor={`${idPrefix}-gender-${option.value}`}
              className={`cursor-pointer rounded-xl px-2 py-2.5 text-center text-base font-bold transition-colors ${
                checked
                  ? "bg-emerald-950 text-white shadow-sm"
                  : error && !value
                    ? "bg-white text-red-600 ring-2 ring-red-300"
                    : "bg-white text-stone-600 hover:bg-emerald-50 hover:text-emerald-900"
              }`}
            >
              <input
                id={`${idPrefix}-gender-${option.value}`}
                type="radio"
                name="gender"
                value={option.value}
                checked={checked}
                onChange={(event) => onChange(event.target.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          );
        })}
      </div>
      <p className="text-xs leading-5 text-stone-500">
        নারী ও পুরুষদের আমল আলাদাভাবে দেখানো হয় — সঠিক অপশন বেছে নিন।
      </p>
    </fieldset>
  );
}
