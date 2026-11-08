const initials = (n: string) =>
  n
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

// Coloured initials circle, same formula as the prototype: hsl(hue 48% 38%).
export function Avatar({ name, hue, size = 32 }: { name: string; hue: number; size?: number }) {
  return (
    <span
      title={name}
      className="inline-grid flex-none place-items-center rounded-full leading-none font-semibold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `hsl(${hue} 48% 38%)`,
      }}
    >
      {initials(name)}
    </span>
  );
}
