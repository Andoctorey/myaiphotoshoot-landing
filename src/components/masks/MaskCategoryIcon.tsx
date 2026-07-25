type Props = {
  iconPath: string | null;
  className?: string;
};

export default function MaskCategoryIcon({
  iconPath,
  className = 'h-5 w-5',
}: Props) {
  if (!iconPath) return null;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d={iconPath} />
    </svg>
  );
}
