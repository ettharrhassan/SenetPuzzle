const CELL_HEIGHT = 100;
const EDGE_PADDING_RATIO = 0.22;
const TAB_DEPTH_RATIO = 0.18;

function randomEdge(random) {
  return random() < 0.5 ? -1 : 1;
}

function formatNumber(value) {
  return Number(value.toFixed(3));
}

function edgePoint(start, tangent, normal, fraction, depth) {
  return {
    x: start.x + tangent.x * fraction + normal.x * depth,
    y: start.y + tangent.y * fraction + normal.y * depth,
  };
}

function pointString(point) {
  return `${formatNumber(point.x)} ${formatNumber(point.y)}`;
}

function appendEdge(path, start, tangent, normal, edge, tabDepth) {
  const end = {
    x: start.x + tangent.x,
    y: start.y + tangent.y,
  };

  if (edge === 0) return `${path} L ${pointString(end)}`;

  const peakDepth = tabDepth * edge;
  const point = (fraction, depth) =>
    edgePoint(start, tangent, normal, fraction, depth);

  return [
    path,
    `L ${pointString(point(0.3, 0))}`,
    `C ${pointString(point(0.35, 0))} ${pointString(point(0.34, peakDepth * 0.16))} ${pointString(point(0.4, peakDepth * 0.16))}`,
    `C ${pointString(point(0.46, peakDepth * 0.16))} ${pointString(point(0.42, peakDepth * 0.82))} ${pointString(point(0.5, peakDepth * 0.82))}`,
    `C ${pointString(point(0.58, peakDepth * 0.82))} ${pointString(point(0.54, peakDepth * 0.16))} ${pointString(point(0.6, peakDepth * 0.16))}`,
    `C ${pointString(point(0.66, peakDepth * 0.16))} ${pointString(point(0.65, 0))} ${pointString(point(0.7, 0))}`,
    `L ${pointString(end)}`,
  ].join(" ");
}

function createPiecePath(
  edges,
  cellWidth,
  cellHeight,
  paddingX,
  paddingY,
  depthX,
  depthY,
) {
  const start = { x: paddingX, y: paddingY };
  let path = `M ${pointString(start)}`;
  path = appendEdge(
    path,
    start,
    { x: cellWidth, y: 0 },
    { x: 0, y: -1 },
    edges.top,
    depthY,
  );
  path = appendEdge(
    path,
    { x: paddingX + cellWidth, y: paddingY },
    { x: 0, y: cellHeight },
    { x: 1, y: 0 },
    edges.right,
    depthX,
  );
  path = appendEdge(
    path,
    { x: paddingX + cellWidth, y: paddingY + cellHeight },
    { x: -cellWidth, y: 0 },
    { x: 0, y: 1 },
    edges.bottom,
    depthY,
  );
  path = appendEdge(
    path,
    { x: paddingX, y: paddingY + cellHeight },
    { x: 0, y: -cellHeight },
    { x: -1, y: 0 },
    edges.left,
    depthX,
  );
  return `${path} Z`;
}

export function createJigsawLayout(columns, rows, random = Math.random) {
  if (
    !Number.isInteger(columns) ||
    !Number.isInteger(rows) ||
    columns < 1 ||
    rows < 1
  ) {
    throw new RangeError("Jigsaw dimensions must be positive integers.");
  }

  const verticalEdges = Array.from({ length: rows }, () =>
    Array.from({ length: columns - 1 }, () => randomEdge(random)),
  );
  const horizontalEdges = Array.from({ length: rows - 1 }, () =>
    Array.from({ length: columns }, () => randomEdge(random)),
  );
  const cellWidth = CELL_HEIGHT;
  const edgePaddingX = CELL_HEIGHT * EDGE_PADDING_RATIO;
  const edgePaddingY = cellWidth * EDGE_PADDING_RATIO;
  const tabDepthX = CELL_HEIGHT * TAB_DEPTH_RATIO;
  const tabDepthY = cellWidth * TAB_DEPTH_RATIO;
  const viewBoxWidth = cellWidth + edgePaddingX * 2;
  const viewBoxHeight = CELL_HEIGHT + edgePaddingY * 2;
  const pieces = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const edges = {
        top: row === 0 ? 0 : -horizontalEdges[row - 1][column],
        right:
          column === columns - 1 ? 0 : verticalEdges[row][column],
        bottom:
          row === rows - 1 ? 0 : horizontalEdges[row][column],
        left:
          column === 0 ? 0 : -verticalEdges[row][column - 1],
      };

      pieces.push({
        id: row * columns + column,
        row,
        column,
        columns,
        rows,
        edges,
        path: createPiecePath(
          edges,
          cellWidth,
          CELL_HEIGHT,
          edgePaddingX,
          edgePaddingY,
          tabDepthX,
          tabDepthY,
        ),
        clipPath: createPiecePath(
          edges,
          cellWidth / viewBoxWidth,
          CELL_HEIGHT / viewBoxHeight,
          edgePaddingX / viewBoxWidth,
          edgePaddingY / viewBoxHeight,
          tabDepthX / viewBoxWidth,
          tabDepthY / viewBoxHeight,
        ),
        cellWidth,
        cellHeight: CELL_HEIGHT,
        edgePaddingX,
        edgePaddingY,
        viewBoxWidth,
        viewBoxHeight,
      });
    }
  }

  return { columns, rows, cellWidth, cellHeight: CELL_HEIGHT, pieces };
}
