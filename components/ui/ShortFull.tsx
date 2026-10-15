// Текст { full, short } из lib/content.ts: короткий до md, полный с md.
// Скрытый вариант – display: none, поэтому скринридер читает только один.
export function ShortFull({ text }: { text: { full: string; short: string } }) {
  if (text.full === text.short) return text.full;

  return (
    <>
      <span className="md:hidden">{text.short}</span>
      <span className="hidden md:inline">{text.full}</span>
    </>
  );
}
