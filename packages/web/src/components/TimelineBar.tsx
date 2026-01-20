import { useMemo, useCallback } from 'react';
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

export function TimelineBar({ entities, decisions, currentTime, onTimeChange }: TimelineBarProps) {
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
      {/* Slider */}
      <div className="relative">
        <Slider
          value={[currentTime]}
          min={timeRange.min}
          max={timeRange.max}
          step={1000}
          onValueChange={handleSliderChange}
          className="w-full"
        />

        {/* NOW button overlay */}
        {!isAtNow && (
          <button
            onClick={() => onTimeChange(timeRange.max)}
            className="absolute right-0 top-1/2 -translate-y-1/2 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-cream bg-warm-elevated hover:bg-warm-deep rounded transition-colors border border-border-subtle"
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
