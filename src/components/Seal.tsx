interface Props {
  text: string;
  sub?: string;
  size?: "sm" | "lg";
}

// 官方印章：以钤印取代任何庆祝动效，单色印章红
export default function Seal({ text, sub, size = "sm" }: Props) {
  return (
    <span className={`stamp ${size === "lg" ? "stamp-lg text-sm" : "text-[11px]"}`}>
      <span>{text}</span>
      {sub && (
        <span className="text-[8px] tracking-[0.15em] opacity-70">{sub}</span>
      )}
    </span>
  );
}
