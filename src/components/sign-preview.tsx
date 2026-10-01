import type { Lettering } from '@/lib/types';

/** The studio snapshot of a sign, or its lettering drawn in CSS when there is no snapshot. */
export function SignPreview({
  previewUrl,
  lettering,
  className = 'size-16',
}: {
  previewUrl: string | null;
  lettering: Lettering | null;
  className?: string;
}) {
  if (previewUrl) {
    return (
      // Studio snapshots are small JPEGs from our own API; next/image would add nothing.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={previewUrl} alt="" className={`shrink-0 rounded-lg bg-gray-900 object-cover ${className}`} />
    );
  }
  return (
    <div
      className={`grid shrink-0 place-items-center overflow-hidden rounded-lg bg-[radial-gradient(ellipse_at_center,#1c1c2a,#07070b_75%)] px-1 ${className}`}
    >
      {lettering ? (
        <span
          className="text-center text-[11px] leading-tight"
          style={{ fontFamily: `"${lettering.fontFamily}", cursive` }}
        >
          {lettering.lines.map((line, i) => (
            <span
              key={i}
              className="block"
              style={{
                color: line.tubeHex ?? '#fff',
                textShadow: `0 0 3px ${line.glowHex}, 0 0 8px ${line.glowHex}`,
              }}
            >
              {line.text}
            </span>
          ))}
        </span>
      ) : (
        <span className="text-[10px] text-gray-500">Logo</span>
      )}
    </div>
  );
}
