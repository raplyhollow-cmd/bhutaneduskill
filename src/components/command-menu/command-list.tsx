/**
 * Command List
 *
 * Filterable list of command items based on search query.
 */

import { useMemo, useCallback, useEffect, useRef } from "react";
import { CommandGroup } from "./command-group";
import { CommandItem } from "./command-item";
import type { CommandItem as CommandItemType, CommandGroup as CommandGroupType } from "@/lib/command-registry";

interface CommandListProps {
  groups: CommandGroupType[];
  query: string;
  selectedIndex: number;
  onSelect: (item: CommandItemType) => void;
  onSelectedIndexChange: (index: number) => void;
}

/**
 * Filter commands based on search query
 */
function filterCommands(groups: CommandGroupType[], query: string): CommandGroupType[] {
  if (!query.trim()) return groups;

  const lowerQuery = query.toLowerCase();

  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const labelMatch = item.label.toLowerCase().includes(lowerQuery);
        const keywordMatch = item.keywords?.some((kw) => kw.toLowerCase().includes(lowerQuery));
        return labelMatch || keywordMatch;
      }),
    }))
    .filter((group) => group.items.length > 0);
}

/**
 * Flatten all items from groups for navigation
 */
function flattenItems(groups: CommandGroupType[]): CommandItemType[] {
  return groups.flatMap((group) => group.items);
}

export function CommandList({
  groups,
  query,
  selectedIndex,
  onSelect,
  onSelectedIndexChange,
}: CommandListProps) {
  const filteredGroups = useMemo(() => filterCommands(groups, query), [groups, query]);
  const flatItems = useMemo(() => flattenItems(filteredGroups), [filteredGroups]);
  const listRef = useRef<HTMLDivElement>(null);

  // Reset selected index when query changes
  useEffect(() => {
    onSelectedIndexChange(0);
  }, [query, onSelectedIndexChange]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          onSelectedIndexChange(Math.min(selectedIndex + 1, flatItems.length - 1));
          break;
        case "ArrowUp":
          event.preventDefault();
          onSelectedIndexChange(Math.max(selectedIndex - 1, 0));
          break;
        case "Enter":
          event.preventDefault();
          if (flatItems[selectedIndex]) {
            onSelect(flatItems[selectedIndex]);
          }
          break;
      }
    },
    [selectedIndex, flatItems, onSelect, onSelectedIndexChange]
  );

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      selectedElement?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  if (filteredGroups.length === 0) {
    return (
      <div className="py-8 text-center text-ceramic-dimmed">
        <p className="text-sm">No commands found</p>
        <p className="text-xs mt-1">Try a different search term</p>
      </div>
    );
  }

  let globalIndex = 0;

  return (
    <div
      ref={listRef}
      className="max-h-[400px] overflow-y-auto py-2"
      onKeyDown={handleKeyDown}
    >
      {filteredGroups.map((group) => (
        <CommandGroup key={group.id} label={group.label}>
          {group.items.map((item) => {
            const currentIndex = globalIndex++;
            return (
              <CommandItem
                key={item.id}
                icon={item.icon}
                shortcut={item.shortcut}
                isSelected={currentIndex === selectedIndex}
                onClick={() => onSelect(item)}
              >
                {item.label}
              </CommandItem>
            );
          })}
        </CommandGroup>
      ))}
    </div>
  );
}
