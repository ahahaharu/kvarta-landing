import { interestLabels, order, type Interest } from "@/lib/content";
import { isInterest } from "@/lib/prefill";

const interests = Object.keys(interestLabels) as Interest[];

type InterestChipsProps = {
  value: Interest;
  onChange: (value: Interest) => void;
};

// radio-группа, визуально – чипы ≥ 48 px: на мобильной столбиком во всю
// ширину, с md – в ряд. Выбранный – ink, фокус рисуем на чипе: сам radio скрыт
export function InterestChips({ value, onChange }: InterestChipsProps) {
  return (
    <fieldset>
      <legend className="text-[0.9375rem] font-bold">
        {order.form.interest.label}
      </legend>
      <div className="mt-2 flex flex-col gap-2 md:flex-row md:flex-wrap">
        {interests.map((interest) => (
          <label
            key={interest}
            className="flex min-h-12 cursor-pointer items-center border-2 border-ink bg-white px-4 text-[0.9375rem] font-bold has-checked:bg-ink has-checked:text-white has-focus-visible:outline-3 has-focus-visible:outline-offset-3 has-focus-visible:outline-ink md:px-5"
          >
            <input
              type="radio"
              name="interest"
              value={interest}
              checked={value === interest}
              onChange={(event) => {
                if (isInterest(event.target.value))
                  onChange(event.target.value);
              }}
              className="sr-only"
            />
            {order.form.interest.options[interest]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
