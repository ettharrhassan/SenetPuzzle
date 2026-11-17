export default function JigsawPiece({
  piece,
  image,
  clipId,
  className = "",
  style = {},
  placeholder = false,
}) {
  const imageClipId = `${clipId}-image`;

  return (
    <svg
      aria-hidden="true"
      className={className}
      focusable="false"
      preserveAspectRatio="none"
      style={style}
      viewBox={`0 0 ${piece.viewBoxWidth} ${piece.viewBoxHeight}`}
    >
      <defs>
        <clipPath clipPathUnits="userSpaceOnUse" id={imageClipId}>
          <path d={piece.path} />
        </clipPath>
        <clipPath clipPathUnits="objectBoundingBox" id={clipId}>
          <path d={piece.clipPath} />
        </clipPath>
      </defs>
      {placeholder ? (
        <path
          className="jigsaw-piece__placeholder-shape"
          d={piece.path}
          vectorEffect="non-scaling-stroke"
        />
      ) : (
        <>
      <image
        clipPath={`url(#${imageClipId})`}
        height={piece.rows * piece.cellHeight}
        href={image}
        preserveAspectRatio="xMidYMid slice"
        width={piece.columns * piece.cellWidth}
        x={piece.edgePaddingX - piece.column * piece.cellWidth}
        y={piece.edgePaddingY - piece.row * piece.cellHeight}
      />
      <path
        className="jigsaw-piece__outline"
        d={piece.path}
        fill="none"
        vectorEffect="non-scaling-stroke"
      />
        </>
      )}
    </svg>
  );
}

