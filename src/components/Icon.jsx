export default function Icon({ icon, size = 20 }) {
  if (!icon) return null;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path fill={`#${icon.hex}`} d={icon.path} />
    </svg>
  );
}
