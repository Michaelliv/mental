import { useMemo, useCallback, useRef, useState, useEffect } from 'react';
import type { Entity, Decision } from '@mentalmodel/shared';
import { Slider } from '@/components/ui/slider';

interface TimelineBarProps {
  entities: Entity[];
  decisions: Record<string, Decision>;
  currentTime: number;
  onTimeChange: (time: number) => void;
}

interface TimelineEvent {
  time: number;
  type: 'domain' | 'capability' | 'aspect' | 'decision';
  label: string;
}

interface EventCluster {
  x: number; // percentage 0-100
  events: TimelineEvent[];
  primaryType: TimelineEvent['type'];
}

const glyphConfig: Record<TimelineEvent['type'], { glyph: string; colorClass: string }> = {
  domain: { glyph: '□', colorClass: 'text-domain' },
  capability: { glyph: '◇', colorClass: 'text-capability' },
  aspect: { glyph: '○', colorClass: 'text-aspect' },
  decision: { glyph: '⚡', colorClass: 'text-decision' },
};

const COLLISION_THRESHOLD_PX = 20; // minimum pixels between events before clustering

export function TimelineBar({ entities, decisions, currentTime, onTimeChange }: TimelineBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Track container width for collision detection
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const { events, timeRange } = useMemo(() => {
    const events: TimelineEvent[] = [];

    for (const entity of entities) {
      if (entity.timestamp) {
        events.push({
          time: new Date(entity.timestamp).getTime(),
          type: entity.type,
          label: entity.label,
        });
      }
    }

    for (const [, decision] of Object.entries(decisions)) {
      if (decision.when) {
        events.push({
          time: new Date(decision.when).getTime(),
          type: 'decision',
          label: decision.what,
        });
      }
    }

    events.sort((a, b) => a.time - b.time);

    const times = events.map(e => e.time);
    const minTime = times.length > 0 ? Math.min(...times) : Date.now();
    const maxTime = Date.now();

    return { events, timeRange: { min: minTime, max: maxTime } };
  }, [entities, decisions]);

  // Cluster nearby events
  const clusters = useMemo(() => {
    if (containerWidth === 0 || events.length === 0) return [];

    const duration = timeRange.max - timeRange.min;
    if (duration === 0) {
      return [{ x: 50, events, primaryType: events[0].type }] as EventCluster[];
    }

    const thresholdPercent = (COLLISION_THRESHOLD_PX / containerWidth) * 100;
    const result: EventCluster[] = [];

    for (const event of events) {
      const x = ((event.time - timeRange.min) / duration) * 100;

      // Try to add to existing cluster
      const existingCluster = result.find(c => Math.abs(c.x - x) < thresholdPercent);
      if (existingCluster) {
        existingCluster.events.push(event);
        // Update x to be average of all events in cluster
        const avgTime = existingCluster.events.reduce((sum, e) => sum + e.time, 0) / existingCluster.events.length;
        existingCluster.x = ((avgTime - timeRange.min) / duration) * 100;
      } else {
        result.push({ x, events: [event], primaryType: event.type });
      }
    }

    return result;
  }, [events, timeRange, containerWidth]);

  // Calculate how "near" a cluster is to the current time (for highlighting)
  const getClusterNearness = useCallback((cluster: EventCluster) => {
    const duration = timeRange.max - timeRange.min;
    if (duration === 0) return 1;
    const avgTime = cluster.events.reduce((sum, e) => sum + e.time, 0) / cluster.events.length;
    const distance = Math.abs(avgTime - currentTime) / duration;
    if (distance < 0.02) return 1;
    if (distance < 0.1) return 0.85;
    return 0.7;
  }, [currentTime, timeRange]);

  const handleSliderChange = useCallback((value: number[]) => {
    onTimeChange(value[0]);
  }, [onTimeChange]);

  const stepPrev = useCallback(() => {
    for (let i = events.length - 1; i >= 0; i--) {
      if (events[i].time < currentTime - 100) {
        onTimeChange(events[i].time);
        return;
      }
    }
    onTimeChange(timeRange.min);
  }, [events, currentTime, onTimeChange, timeRange.min]);

  const stepNext = useCallback(() => {
    for (const event of events) {
      if (event.time > currentTime + 100) {
        onTimeChange(event.time);
        return;
      }
    }
    onTimeChange(timeRange.max);
  }, [events, currentTime, onTimeChange, timeRange.max]);

  const isAtNow = currentTime >= timeRange.max - 1000;

  const formatDate = (time: number) => {
    const date = new Date(time);
    const dateFormatter = new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
    });
    const timeFormatter = new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${dateFormatter.format(date)}, ${timeFormatter.format(date)}`;
  };

  if (events.length === 0) {
    return null;
  }

  return (
    <div className="flex-shrink-0 border-t border-border-default bg-warm-surface px-4 py-3 select-none">
      {/* Timeline visualization container */}
      <div ref={containerRef} className="relative">
        {/* Glyphs and ticks layer - above slider */}
        <div className="relative h-8 mb-0.5">
          {clusters.map((cluster, i) => {
            const config = glyphConfig[cluster.primaryType];
            const nearness = getClusterNearness(cluster);
            const count = cluster.events.length;
            const tooltip = cluster.events.map(e => e.label).join(', ');

            return (
              <div
                key={`cluster-${i}`}
                className="absolute flex flex-col items-center"
                style={{
                  left: `${cluster.x}%`,
                  top: 0,
                  bottom: 0,
                  transform: 'translateX(-50%)',
                }}
              >
                {/* Glyph */}
                <button
                  onClick={() => onTimeChange(cluster.events[0].time)}
                  title={tooltip}
                  className={`transition-all duration-150 text-xs font-mono ${config.colorClass} hover:scale-125`}
                  style={{
                    opacity: nearness,
                    textShadow: nearness === 1 ? '0 0 8px currentColor' : 'none',
                  }}
                >
                  {config.glyph}
                  {count > 1 && (
                    <sup className="text-[8px] font-bold ml-px">{count}</sup>
                  )}
                </button>
                {/* Tick mark */}
                <div className="flex-1 w-0.5 bg-cream-45" />
              </div>
            );
          })}
        </div>

        {/* Slider */}
        <div className="relative">
          <Slider
            value={[currentTime]}
            min={timeRange.min}
            max={timeRange.max}
            step={1000}
            onValueChange={handleSliderChange}
            className="w-full relative z-10"
          />
        </div>

        {/* NOW button overlay - above slider */}
        {!isAtNow && (
          <button
            onClick={() => onTimeChange(timeRange.max)}
            className="absolute right-0 top-0 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-cream bg-warm-elevated hover:bg-warm-deep rounded transition-colors border border-border-subtle"
          >
            Now →
          </button>
        )}
      </div>

      {/* Date labels row with steppers */}
      <div className="flex justify-between items-center mt-3">
        <span className="text-xs font-medium text-cream-60">
          {formatDate(timeRange.min)}
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={stepPrev}
            className="px-2 py-0.5 text-xs font-medium text-cream-60 hover:text-cream hover:bg-warm-elevated rounded transition-colors"
          >
            ← Prev
          </button>
          <span className="text-sm font-bold text-cream">
            {isAtNow ? 'Now' : formatDate(currentTime)}
          </span>
          <button
            onClick={stepNext}
            className="px-2 py-0.5 text-xs font-medium text-cream-60 hover:text-cream hover:bg-warm-elevated rounded transition-colors"
          >
            Next →
          </button>
        </div>
        <span className="text-xs font-medium text-cream-60">
          {formatDate(timeRange.max)}
        </span>
      </div>
    </div>
  );
}
