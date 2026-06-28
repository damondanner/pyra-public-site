(() => {
  const HISTORY_PATH = 'api/barter-credit-history.json';
  const REFRESH_MS = 5 * 60 * 1000;
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const chart = document.getElementById('barterCreditHistoryChart');
  const summary = document.getElementById('barterCreditHistorySummary');
  const current = document.getElementById('historyCurrentValue');
  const minimum = document.getElementById('historyMinimumValue');
  const maximum = document.getElementById('historyMaximumValue');

  if (!chart || !summary || !current || !minimum || !maximum) return;

  function formatBtc(value) {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  function formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC'
    }).format(new Date(`${date}T00:00:00.000Z`));
  }

  function svgElement(name, attributes = {}, text = '') {
    const element = document.createElementNS(SVG_NS, name);
    for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
    if (text) element.textContent = text;
    return element;
  }

  function readPoints(payload) {
    if (!payload || payload.type !== 'pyra_public_barter_credit_history' || !Array.isArray(payload.points)) return [];
    return payload.points
      .filter(point => (
        point &&
        /^\d{4}-\d{2}-\d{2}$/.test(point.date || '') &&
        Number.isFinite(Number(point.value)) &&
        Number(point.value) > 0 &&
        ['observed', 'reconstructed'].includes(point.kind)
      ))
      .map(point => ({ ...point, value: Number(point.value) }))
      .sort((left, right) => left.date.localeCompare(right.date));
  }

  function buildSegments(points) {
    if (points.length === 0) return [];
    const segments = [];
    let segment = { kind: points[0].kind, points: [points[0]] };

    for (let index = 1; index < points.length; index += 1) {
      const point = points[index];
      if (point.kind !== segment.kind) {
        segments.push(segment);
        segment = { kind: point.kind, points: [points[index - 1], point] };
      } else {
        segment.points.push(point);
      }
    }

    segments.push(segment);
    return segments;
  }

  function render(payload) {
    const points = readPoints(payload);
    if (points.length === 0) throw new Error('No valid history points');

    const values = points.map(point => point.value);
    const latest = points[points.length - 1];
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const reconstructedCount = points.filter(point => point.kind === 'reconstructed').length;
    const observedCount = points.length - reconstructedCount;

    current.textContent = `btc (barter credit) ${formatBtc(latest.value)}`;
    minimum.textContent = `btc (barter credit) ${formatBtc(minValue)}`;
    maximum.textContent = `btc (barter credit) ${formatBtc(maxValue)}`;
    summary.textContent = `${points.length} daily UTC points from ${formatDate(points[0].date)} through ${formatDate(latest.date)}. ${reconstructedCount} reconstructed; ${observedCount} observed.`;

    chart.replaceChildren();
    chart.setAttribute('aria-label', `PYRA barter credit history from ${formatDate(points[0].date)} through ${formatDate(latest.date)}. Latest btc ${formatBtc(latest.value)}, minimum btc ${formatBtc(minValue)}, maximum btc ${formatBtc(maxValue)}.`);

    const width = 760;
    const height = 300;
    const margin = { top: 20, right: 24, bottom: 42, left: 76 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const spread = maxValue - minValue;
    const padding = spread > 0 ? spread * 0.1 : Math.max(maxValue * 0.08, 1);
    const yMin = Math.max(0, minValue - padding);
    const yMax = maxValue + padding;
    const x = index => points.length === 1
      ? margin.left + plotWidth / 2
      : margin.left + (index / (points.length - 1)) * plotWidth;
    const y = value => margin.top + ((yMax - value) / (yMax - yMin || 1)) * plotHeight;

    chart.appendChild(svgElement('title', {}, 'PYRA barter credit daily history'));
    chart.appendChild(svgElement('desc', {}, 'Dashed gold segments are reconstructed from CoinGecko historical data. Solid green segments and points are observed PYRA snapshots.'));

    for (let step = 0; step <= 4; step += 1) {
      const value = yMax - ((yMax - yMin) * step / 4);
      const yPosition = margin.top + plotHeight * step / 4;
      chart.appendChild(svgElement('line', {
        x1: margin.left,
        y1: yPosition,
        x2: width - margin.right,
        y2: yPosition,
        class: 'history-grid-line'
      }));
      chart.appendChild(svgElement('text', {
        x: margin.left - 10,
        y: yPosition + 4,
        class: 'history-axis-label',
        'text-anchor': 'end'
      }, `btc ${formatBtc(value)}`));
    }

    const pathFor = segmentPoints => segmentPoints
      .map(point => {
        const index = points.indexOf(point);
        return `${index === points.indexOf(segmentPoints[0]) ? 'M' : 'L'} ${x(index).toFixed(2)} ${y(point.value).toFixed(2)}`;
      })
      .join(' ');

    for (const segment of buildSegments(points)) {
      chart.appendChild(svgElement('path', {
        d: pathFor(segment.points),
        class: `history-line history-line-${segment.kind}`
      }));
    }

    const pointStep = Math.max(1, Math.ceil(points.length / 24));
    points.forEach((point, index) => {
      if (index % pointStep !== 0 && index !== points.length - 1) return;
      const circle = svgElement('circle', {
        cx: x(index),
        cy: y(point.value),
        r: point.kind === 'observed' ? 4.5 : 3,
        class: `history-point history-point-${point.kind}`,
        tabindex: '0'
      });
      circle.appendChild(svgElement('title', {}, `${formatDate(point.date)}: btc (barter credit) ${formatBtc(point.value)}; ${point.kind} from ${point.valid_rows || 0} qualifying prices.`));
      chart.appendChild(circle);
    });

    const labelIndexes = [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])];
    for (const index of labelIndexes) {
      chart.appendChild(svgElement('text', {
        x: x(index),
        y: height - 12,
        class: 'history-axis-label',
        'text-anchor': index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle'
      }, formatDate(points[index].date)));
    }
  }

  async function refresh() {
    const bucket = Math.floor(Date.now() / REFRESH_MS);
    const response = await fetch(`${HISTORY_PATH}?v=${bucket}`, {
      headers: { accept: 'application/json' },
      cache: 'no-store'
    });
    if (!response.ok) throw new Error(`History endpoint returned ${response.status}`);
    render(await response.json());
  }

  refresh().catch(() => {
    summary.textContent = 'Verified barter-credit history is temporarily unavailable.';
  });
  setInterval(() => refresh().catch(() => {}), REFRESH_MS);
})();
