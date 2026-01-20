import { useRef, useCallback, useMemo } from 'react';
import type { Entity, Decision } from '@mentalmodel/shared';

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
  const barRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

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

  const timeToPosition = useCallback((time: number) => {
    const range = timeRange.max - timeRange.min;
    if (range === 0) return 1;
    return (time - timeRange.min) / range;
  }, [timeRange]);

  const positionToTime = useCallback((position: number) => {
    const range = timeRange.max - timeRange.min;
    return timeRange.min + position * range;
  }, [timeRange]);

  const updateTimeFromEvent = useCallback((clientX: number) => {
    if (!barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const position = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onTimeChange(positionToTime(position));
  }, [positionToTime, onTimeChange]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    updateTimeFromEvent(e.clientX);

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        updateTimeFromEvent(e.clientX);
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [updateTimeFromEvent]);

  const handleDoubleClick = useCallback(() => {
    onTimeChange(timeRange.max);
  }, [onTimeChange, timeRange.max]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const step = (timeRange.max - timeRange.min) / 100; // 1% per key press
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        onTimeChange(Math.max(timeRange.min, currentTime - step));
        break;
      case 'ArrowRight':
        e.preventDefault();
        onTimeChange(Math.min(timeRange.max, currentTime + step));
        break;
      case 'Home':
        e.preventDefault();
        onTimeChange(timeRange.min);
        break;
      case 'End':
        e.preventDefault();
        onTimeChange(timeRange.max);
        break;
    }
  }, [currentTime, onTimeChange, timeRange]);

  const stepPrev = useCallback(() => {
    // Find the previous event before currentTime
    for (let i = events.length - 1; i >= 0; i--) {
      if (events[i].time < currentTime - 100) {
        onTimeChange(events[i].time);
        return;
      }
    }
    // If no previous event, go to start
    onTimeChange(timeRange.min);
  }, [events, currentTime, onTimeChange, timeRange.min]);

  const stepNext = useCallback(() => {
    // Find the next event after currentTime
    for (const event of events) {
      if (event.time > currentTime + 100) {
        onTimeChange(event.time);
        return;
      }
    }
    // If no next event, go to now
    onTimeChange(timeRange.max);
  }, [events, currentTime, onTimeChange, timeRange.max]);

  const currentPosition = timeToPosition(currentTime);
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
    <div className="flex-shrink-0 h-16 border-t border-border-default bg-warm-surface px-4 py-2 select-none">
      {/* Timeline track */}
      <div
        ref={barRef}
        role="slider"
        tabIndex={0}
        aria-label="Timeline position"
        aria-valuemin={timeRange.min}
        aria-valuemax={timeRange.max}
        aria-valuenow={currentTime}
        aria-valuetext={isAtNow ? 'Now' : formatDate(currentTime)}
        className="relative h-6 rounded-lg bg-warm-elevated border border-border-subtle cursor-ew-resize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream/30"
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
      >
        {/* Progress fill */}
        <div
          className="absolute inset-y-0 left-0 rounded-l-lg bg-cream-28/20"
          style={{ width: `${currentPosition * 100}%` }}
        />

        {/* Current position handle */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-cream rounded-full shadow-md"
          style={{
            left: `${currentPosition * 100}%`,
            transform: 'translateX(-50%)',
          }}
        >
          {/* Handle knob */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-cream border-2 border-warm-surface shadow-sm" />
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-cream border-2 border-warm-surface shadow-sm" />
        </div>

        {/* NOW button overlay */}
        {!isAtNow && (
          <button
            onClick={() => onTimeChange(timeRange.max)}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-cream bg-warm-deep/80 hover:bg-warm-deep rounded transition-colors"
          >
            Now →
          </button>
        )}
      </div>

      {/* Date labels row with steppers */}
      <div className="flex justify-between items-center mt-2">
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
