import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Reorder, useDragControls, motion } from 'framer-motion';
import type { Category } from '../types';
import { haptic, HAPTIC } from '../lib/haptic';

const LONG_PRESS_MS = 380;

interface CategoryReorderItemProps {
  item: Category;
  onItemClick?: (item: Category) => void;
  onDragEnd: () => void;
  itemClassName?: string;
  renderItem: (item: Category) => ReactNode;
}

function CategoryReorderItem({
  item,
  onItemClick,
  onDragEnd,
  itemClassName,
  renderItem,
}: CategoryReorderItemProps) {
  const controls = useDragControls();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressClickRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      onDragStart={() => {
        suppressClickRef.current = true;
      }}
      onDragEnd={onDragEnd}
      className={itemClassName}
      style={{ touchAction: 'none', position: 'relative' }}
      whileDrag={{
        scale: 1.03,
        zIndex: 50,
        boxShadow: '0 12px 32px rgba(0,0,0,0.45)',
      }}
      transition={{ layout: { type: 'spring', stiffness: 500, damping: 35 } }}
    >
      <motion.div
        className="flex items-center gap-3 w-full select-none"
        style={{ touchAction: 'none' }}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          if ((e.target as HTMLElement).closest('button')) return;
          clearTimer();
          timerRef.current = setTimeout(() => {
            suppressClickRef.current = true;
            haptic(HAPTIC.medium);
            controls.start(e);
          }, LONG_PRESS_MS);
        }}
        onPointerUp={clearTimer}
        onPointerLeave={clearTimer}
        onPointerCancel={clearTimer}
        onClick={() => {
          if (suppressClickRef.current) {
            suppressClickRef.current = false;
            return;
          }
          onItemClick?.(item);
        }}
      >
        {renderItem(item)}
      </motion.div>
    </Reorder.Item>
  );
}

interface CategoryReorderGroupProps {
  items: Category[];
  onOrderChange: (orderedIds: string[]) => void;
  onItemClick?: (item: Category) => void;
  className?: string;
  itemClassName?: string;
  renderItem: (item: Category) => ReactNode;
}

export function CategoryReorderGroup({
  items: itemsProp,
  onOrderChange,
  onItemClick,
  className = 'flex flex-col list-none m-0 p-0',
  itemClassName,
  renderItem,
}: CategoryReorderGroupProps) {
  const [items, setItems] = useState(itemsProp);
  const itemsRef = useRef(items);

  useEffect(() => {
    setItems(itemsProp);
  }, [itemsProp]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const handleReorder = useCallback((next: Category[]) => {
    setItems(next);
    itemsRef.current = next;
  }, []);

  const handleDragEnd = useCallback(() => {
    onOrderChange(itemsRef.current.map((c) => c.id));
  }, [onOrderChange]);

  return (
    <Reorder.Group
      axis="y"
      values={items}
      onReorder={handleReorder}
      layoutScroll
      className={className}
    >
      {items.map((item) => (
        <CategoryReorderItem
          key={item.id}
          item={item}
          onItemClick={onItemClick}
          onDragEnd={handleDragEnd}
          itemClassName={itemClassName}
          renderItem={renderItem}
        />
      ))}
    </Reorder.Group>
  );
}
