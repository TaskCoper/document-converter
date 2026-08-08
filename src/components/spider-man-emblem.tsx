export function SpiderManEmblem() {
  return (
    <div
      className="spider-theme-emblem pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden transition-opacity duration-200 motion-reduce:transition-none"
      aria-hidden="true"
    >
      <img
        src="/spider-man-emblem-white.png"
        alt=""
        className="h-auto w-40 select-none sm:w-52 lg:w-64"
        draggable={false}
      />
    </div>
  );
}
