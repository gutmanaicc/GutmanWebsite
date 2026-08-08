import { Fragment } from "react";

/**
 * מפצל טקסט למילים כדי לאפשר כניסה מדורגת.
 *
 * ברמת מילה בלבד, אף פעם לא ברמת תו. פיצול לתווים שובר עברית:
 * הוא קוטע רצפי bidi, מנתק ניקוד מהאות שלו, וגורם לקורא מסך להקריא
 * אות-אות. המילה נשארת יחידה אחת, והרווחים נשארים צמתי טקסט אמיתיים
 * כדי שההקראה והבחירה יישארו תקינות.
 */
export function Words({
  text,
  start = 0,
  className,
}: {
  text: string;
  start?: number;
  className?: string;
}) {
  const words = text.split(" ");

  return (
    <>
      {words.map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          <span
            className={className ? `word ${className}` : "word"}
            style={{ "--wi": start + i } as React.CSSProperties}
          >
            {word}
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </>
  );
}

export default Words;
